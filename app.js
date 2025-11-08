document.addEventListener('DOMContentLoaded', async () => {
    // Define the base URL for your Python backend
    const API_BASE_URL = 'http://127.0.0.1:5000';

    // --- Farmer Login Page Logic ---
    const loginForm = document.getElementById('login-form');
    const otpContainer = document.getElementById('otp-container');
    const loginFormContainer = document.getElementById('login-form-container');
    const otpForm = document.getElementById('otp-form');
    const resendBtn = document.getElementById('resend-otp');
    const timerEl = document.getElementById('timer');
    const otpErrorEl = document.getElementById('otp-error');

    let otpTimer;

    // Function to start the OTP timer
    function startTimer() {
        let timeLeft = 180; // 3 minutes
        resendBtn.disabled = true;
        timerEl.textContent = `Seconds left: ${timeLeft}`;
        otpTimer = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `Seconds left: ${timeLeft}`;

            if (timeLeft <= 0) {
                clearInterval(otpTimer);
                resendBtn.disabled = false;
                timerEl.textContent = 'Time up, you can resend OTP';
            }
        }, 1000);
    }

    // Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const emailErrorEl = document.getElementById('email-error');

        // Clear previous errors
        emailErrorEl.textContent = '';

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailErrorEl.textContent = 'Please enter a valid email address.';
            return; // Stop the function
        }

        // Call the Python backend to send an OTP
        const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        if (response.ok) {
            loginFormContainer.classList.add('hidden');
            otpContainer.classList.remove('hidden');
            startTimer();
        } else {
            alert('Failed to send OTP. Please try again.');
        }
    });
}

    // Handle OTP resend
if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
        clearInterval(otpTimer);
        const email = document.getElementById('email').value;
        const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        if (response.ok) {
            alert('OTP resent successfully.');
            startTimer();
        }
    });
}

    // Handle OTP verification
if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const otp = document.getElementById('otp-input').value;

        const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        if (response.ok) {
            localStorage.setItem('farmerEmail', email);
            window.location.href = 'farmer-dashboard.html';
        } else {
            otpErrorEl.textContent = 'Invalid OTP';
        }
    });
}

    // --- Farmer Dashboard Page Logic ---
    const openModalBtn = document.getElementById('open-storage-modal');
    const storageModal = document.getElementById('storage-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const checkSpaceBtn = document.getElementById('check-space-btn');
    const spaceStatusEl = document.getElementById('space-status');
    const storageForm = document.getElementById('storage-form');
    const storageReplyEl = document.getElementById('storage-reply');
    const viewConditionBtn = document.getElementById('view-condition-btn');
    const conditionInfo = document.getElementById('condition-info');
    const conditionData = document.getElementById('condition-data');

    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => storageModal.classList.remove('hidden'));
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => storageModal.classList.add('hidden'));
    }
if (checkSpaceBtn) {
    checkSpaceBtn.addEventListener('click', async () => {
        const response = await fetch(`${API_BASE_URL}/api/check-space`, { method: 'POST' });
        const data = await response.json();
        const currentLang = localStorage.getItem('language') || 'en';

        const isAvailable = data.space_available;
        spaceStatusEl.textContent = isAvailable ? translations[currentLang].space_available : translations[currentLang].space_unavailable;
        spaceStatusEl.style.color = isAvailable ? 'green' : 'red';
    });
}

if (storageForm) {
    storageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const farmerName = document.getElementById('farmer-name').value;
        const cropName = document.getElementById('crop-name').value;
        const quantity = document.getElementById('quantity').value;
        const email = localStorage.getItem('farmerEmail');

        const response = await fetch(`${API_BASE_URL}/api/submit-storage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ farmer_name: farmerName, crop_name: cropName, quantity: quantity, email: email })
        });

        if (response.ok) {
            const data = await response.json();
            storageReplyEl.textContent = data.message;
            storageReplyEl.classList.remove('hidden');
            setTimeout(() => storageModal.classList.add('hidden'), 2000);
        }
    });
}
if (viewConditionBtn) {
    viewConditionBtn.addEventListener('click', async () => {
        const email = localStorage.getItem('farmerEmail');
        const response = await fetch(`${API_BASE_URL}/api/get-farmer-requests?email=${encodeURIComponent(email)}`);
        const requests = await response.json();

        if (requests.length === 0) {
            conditionData.textContent = 'You have no crops currently in storage.';
        } else {
            conditionData.innerHTML = requests.map(req => `
                <div>
                    <p><b>Crop:</b> ${req.crop_name} (${req.quantity} kg)</p>
                    <p><b>Condition:</b> ${req.condition}</p>
                </div>
            `).join('');
        }

        conditionInfo.classList.toggle('hidden');
    });
}

    // --- Cold Storage Login Page Logic ---
    const csLoginForm = document.getElementById('cold-storage-login-form');
    if (csLoginForm) {
        csLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const secretCode = document.getElementById('secret-code').value;
            const response = await fetch(`${API_BASE_URL}/api/cold-storage-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret_code: secretCode })
            });

            if (response.ok) {
                window.location.href = 'cold-storage-dashboard.html';
            } else {
                document.getElementById('login-error').textContent = 'Invalid secret code. Please try again.';
            }
        });
    }

    // --- Cold Storage Dashboard Logic ---
    const requestsList = document.getElementById('requests-list');
    const updateForm = document.getElementById('update-condition-form');
    let selectedRequestId = null;

    if (requestsList) {
        // Fetch and display farmer requests when the dashboard loads
        const response = await fetch(`${API_BASE_URL}/api/get-farmer-requests`);
        const requests = await response.json();
        requestsList.innerHTML = requests.map(req => `
            <div class="request-item">
                <input type="radio" name="farmer-select" value="${req.id}" id="req-${req.id}">
                <label for="req-${req.id}">
                    <p><b>Farmer:</b> ${req.farmer_name}</p>
                    <p><b>Crop:</b> ${req.crop_name} (${req.quantity} kg)</p>
                    <p><b>Current Condition:</b> ${req.condition}</p>
                </label>
            </div>
        `).join('');

        // Add event listeners to radio buttons
        document.querySelectorAll('input[name="farmer-select"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                selectedRequestId = parseInt(e.target.value);
            });
        });

        // Handle form submission for updating condition
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedRequestId) {
                alert('Please select a farmer first.');
                return;
            }
            const condition = document.getElementById('condition-input').value;
            const updateResponse = await fetch(`${API_BASE_URL}/api/update-condition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: selectedRequestId, condition: condition })
            });
            if (updateResponse.ok) {
                alert('Condition updated successfully.');
                window.location.reload(); // Reload to see the changes
            } else {
                alert('Failed to update condition.');
            }
        });
    }

    // --- Wholesaler Login Page Logic ---
    const wsLoginForm = document.getElementById('wholesaler-login-form');
    if (wsLoginForm) {
        wsLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const wholesalerId = document.getElementById('wholesaler-id').value;
            const response = await fetch(`${API_BASE_URL}/api/wholesaler-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wholesaler_id: wholesalerId })
            });

            if (response.ok) {
                // Store wholesaler ID to use on the dashboard
                localStorage.setItem('wholesalerId', wholesalerId);
                window.location.href = 'wholesaler-dashboard.html';
            } else {
                document.getElementById('login-error').textContent = 'Invalid Wholesaler ID. Please try again.';
            }
        });
    }

    // --- Wholesaler Dashboard Logic ---
    const priceUpdateForm = document.getElementById('price-update-form');
    const detailsUpdateForm = document.getElementById('details-update-form');

    if (detailsUpdateForm) { // Check if we are on the wholesaler dashboard
        const wholesalerId = localStorage.getItem('wholesalerId');

        // 1. Fetch and populate wholesaler details
        const detailsResponse = await fetch(`${API_BASE_URL}/api/get-wholesaler-details?id=${wholesalerId}`);
        if (detailsResponse.ok) {
            const details = await detailsResponse.json();
            document.getElementById('wholesaler-name').value = details.name;
            document.getElementById('wholesaler-location').value = details.location;
            document.getElementById('wholesaler-payment').value = details.payment_procedure;
        }

        // 2. Handle details update submission
        detailsUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('wholesaler-name').value;
            const location = document.getElementById('wholesaler-location').value;
            const payment_procedure = document.getElementById('wholesaler-payment').value;

            const response = await fetch(`${API_BASE_URL}/api/update-wholesaler-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wholesaler_id: wholesalerId, name, location, payment_procedure })
            });

            if (response.ok) {
                alert('Details updated successfully!');
            } else {
                alert('Failed to update details.');
            }
        });

        // 3. Fetch and render crop pricing form
        if (priceUpdateForm) {
            const cropPricingList = document.getElementById('crop-pricing-list');
            const cropsResponse = await fetch(`${API_BASE_URL}/api/get-crops-for-pricing`);
            const crops = await cropsResponse.json();

            cropPricingList.innerHTML = crops.map(crop => `
                <div class="form-group">
                    <label for="price-${crop}">${crop}:</label>
                    <input type="number" id="price-${crop}" name="${crop}" placeholder="Price per kg" step="0.01" min="0">
                </div>
            `).join('');

            // 4. Handle price update submission
            priceUpdateForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const prices = {};
                const inputs = priceUpdateForm.querySelectorAll('input[type="number"]');
                inputs.forEach(input => {
                    if (input.value) {
                        prices[input.name] = parseFloat(input.value);
                    }
                });

                await fetch(`${API_BASE_URL}/api/update-prices`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wholesaler_id: wholesalerId, prices: prices })
                });

                alert('Prices updated successfully!');
            });
        }
    }

    // --- Market Prices Page Logic (for Farmers) ---
    const marketPricesList = document.getElementById('market-prices-list');
    const notificationContainer = document.getElementById('notification-container');

    function showNotification(message) {
        if (!notificationContainer) return;
        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.textContent = message;
        notificationContainer.appendChild(notification);

        // Remove the notification after a few seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    function renderMarketPrices(prices) {
        const currentLang = localStorage.getItem('language') || 'en';
        if (prices.length === 0) {
            marketPricesList.innerHTML = '<p>No market prices have been set yet. Please check back later.</p>';
        } else {
            // Sort by crop name for consistent ordering
            prices.sort((a, b) => a.crop_name.localeCompare(b.crop_name));

            marketPricesList.innerHTML = prices.map(item => {
                let changeIndicator = '';
                let priceClass = '';
                // item.change: 1 for up, -1 for down, 0 for no change
                if (item.change === 1) {
                    changeIndicator = '<span class="price-up">▲</span>'; // Up arrow
                    priceClass = 'price-up';
                } else if (item.change === -1) {
                    changeIndicator = '<span class="price-down">▼</span>'; // Down arrow
                    priceClass = 'price-down';
                }

                return `
                <div class="price-item ${priceClass}">
                    <div class="price-details">
                        <h3>${item.crop_name}</h3>
                        <p class="price-value">
                            ₹${item.price.toFixed(2)} / kg ${changeIndicator}
                        </p>
                    </div>
                    <div class="wholesaler-details">
                        <p>Official Market Rate</p>
                        <p>Last updated: ${new Date(item.last_updated).toLocaleTimeString()}</p>
                    </div>
                </div>
            `}).join('');
        }
    }

    if (marketPricesList) {
        // Initial fetch via HTTP
        const response = await fetch(`${API_BASE_URL}/api/get-market-prices`);
        const prices = await response.json();
        renderMarketPrices(prices);

        // Connect to WebSocket for real-time updates
        const socket = io(API_BASE_URL);
        socket.on('price_update', function(updatedPrices) {
            console.log("Market Update Received:", updatedPrices);
            
            // Show notifications for any crop that has changed price
            updatedPrices.forEach(item => {
                if (item.change !== 0) { // If price went up or down
                    const direction = item.change === 1 ? 'increased' : 'decreased';
                    showNotification(`${item.crop_name} price has ${direction} to ₹${item.price.toFixed(2)}`);
                }
            });

            renderMarketPrices(updatedPrices);
        });
    }

});

// ✅ Function for user's actual current location
function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        window.open(locationUrl, "_blank"); // Opens real Google Maps
      },
      function (error) {
        alert("Unable to access location. Please enable GPS or location permission.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

// ✅ Function for real market/cold storage location
function openSpecificLocation() {
  const marketAddress = "Kadur Cold Storage, Chikkamagaluru, Karnataka"; // 🔁 Replace with your actual place name or coordinates
  const locationUrl = `https://www.google.com/maps?q=${encodeURIComponent(marketAddress)}`;
  window.open(locationUrl, "_blank");
}
