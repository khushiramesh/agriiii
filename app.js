document.addEventListener('DOMContentLoaded', () => {
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
        const phone = document.getElementById('phone').value;
        const phoneErrorEl = document.getElementById('phone-error');

        // Clear previous errors
        phoneErrorEl.textContent = '';

        // Validate phone number length
        const currentLang = localStorage.getItem('language') || 'en';
        if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
            phoneErrorEl.textContent = translations[currentLang].invalid_phone;
            return; // Stop the function
        }

        // Call the Python backend to send an OTP
        const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`OTP for testing: ${data.otp_for_testing}`); // For development only
            loginFormContainer.classList.add('hidden');
            otpContainer.classList.remove('hidden');
            startTimer();
        } else {
            const currentLang = localStorage.getItem('language') || 'en';
            alert(translations[currentLang].otp_send_failed);
        }
    });
}

    // Handle OTP resend
if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
        clearInterval(otpTimer);
        const phone = document.getElementById('phone').value;
        const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone })
        });
        if (response.ok) {
            const currentLang = localStorage.getItem('language') || 'en';
            alert(translations[currentLang].otp_resent);
            startTimer();
        }
    });
}

    // Handle OTP verification
if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('phone').value;
        const otp = document.getElementById('otp-input').value;

        const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp })
        });

        if (response.ok) {
            window.location.href = 'farmer-dashboard.html';
        } else {
            const currentLang = localStorage.getItem('language') || 'en';
            otpErrorEl.textContent = translations[currentLang].invalid_otp;
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
        const cropName = document.getElementById('crop-name').value;
        const quantity = document.getElementById('quantity').value;

        const response = await fetch(`${API_BASE_URL}/api/submit-storage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ crop_name: cropName, quantity: quantity })
        });

        if (response.ok) {
            const currentLang = localStorage.getItem('language') || 'en';
            storageReplyEl.textContent = translations[currentLang].req_sent;
            storageReplyEl.classList.remove('hidden');
            setTimeout(() => storageModal.classList.add('hidden'), 2000);
        }
    });
}
if (viewConditionBtn) {
    viewConditionBtn.addEventListener('click', async () => {
        // Fetch data from the Python backend
        const response = await fetch(`${API_BASE_URL}/api/crop-condition`);
        const data = await response.json();
        const currentLang = localStorage.getItem('language') || 'en';
        
        if (data.message_key) {
            // If the backend sends a key, translate it
            conditionData.textContent = translations[currentLang][data.message_key];
        } else {
            // Otherwise, display the direct message
            conditionData.textContent = data.message;
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
    const updateModal = document.getElementById('update-modal');
    const updateForm = document.getElementById('update-condition-form');

    if (requestsList) {
        // Fetch and display farmer requests when the dashboard loads
        const response = await fetch(`${API_BASE_URL}/api/get-farmer-requests`);
        const requests = await response.json();
        requestsList.innerHTML = requests.map(req => `
            <div class="request-item">
                <p><b>Request ID:</b> ${req.id}</p>
                <p><b>Crop:</b> ${req.crop_name} (${req.quantity} kg)</p>
                <p><b>Current Condition:</b> ${req.condition}</p>
                <button class="update-btn" data-id="${req.id}">Update Condition</button>
            </div>
        `).join('');

        // Add event listeners to "Update" buttons
        document.querySelectorAll('.update-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const requestId = e.target.dataset.id;
                document.getElementById('request-id').value = requestId;
                updateModal.classList.remove('hidden');
            });
        });

        // Handle modal close
        updateModal.querySelector('.close-button').addEventListener('click', () => updateModal.classList.add('hidden'));

        // Handle form submission for updating condition
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const requestId = parseInt(document.getElementById('request-id').value);
            const condition = document.getElementById('condition-input').value;
            await fetch(`${API_BASE_URL}/api/update-condition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: requestId, condition: condition })
            });
            window.location.reload(); // Reload to see the changes
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
    if (marketPricesList) {
        const response = await fetch(`${API_BASE_URL}/api/get-market-prices`);
        const prices = await response.json();
        const currentLang = localStorage.getItem('language') || 'en';

        if (prices.length === 0) {
            marketPricesList.innerHTML = '<p>No market prices have been set yet. Please check back later.</p>';
        } else {
            marketPricesList.innerHTML = prices.map(item => `
                <div class="price-item">
                    <div class="price-details">
                        <h3>${item.crop_name}</h3>
                        <p class="price-value">₹${item.price.toFixed(2)} / kg</p>
                    </div>
                    <div class="wholesaler-details">
                        <p><b>Wholesaler:</b> ${item.name}</p>
                        <p><b>Location:</b> ${item.location}</p>
                        <p><a href="${item.location_url}" target="_blank" class="map-link">${translations[currentLang].view_on_map}</a></p>
                        <p><b>${translations[currentLang].payment_procedure}</b> ${item.payment_procedure}</p>
                    </div>
                </div>
            `).join('');
        }
    }

});
