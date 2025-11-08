import os
import random
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_socketio import SocketIO
from datetime import datetime, timedelta
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler

load_dotenv()

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
app.secret_key = os.getenv("SECRET_KEY", 'a_strong_random_secret')
CORS(app)

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("EMAIL_USER")
app.config['MAIL_PASSWORD'] = os.getenv("EMAIL_PASS")
app.config['MAIL_DEFAULT_SENDER'] = os.getenv("EMAIL_USER")
app.config['MAIL_USE_SSL'] = False

mail = Mail(app)

# In-memory store for OTPs (for production use DB or cache)
otp_store = {}  # key: email, value: { otp: '123456', expires: datetime }

# In-memory storage for demo purposes (replace with database in production)
farmer_requests = []
wholesalers = {
    'WS001': {'name': 'Wholesaler A', 'location': 'Delhi', 'payment_procedure': 'Cash on Delivery'},
    'WS002': {'name': 'Wholesaler B', 'location': 'Mumbai', 'payment_procedure': 'Online Payment'}
}
crop_prices = {} # Prices set by wholesalers
payments = [] # To store payment transaction info

# In-memory store for real-time market prices (simulating a database)
market_prices_store = []

@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json() or request.form
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    otp = str(random.randint(100000, 999999))
    expiry_time = datetime.now() + timedelta(minutes=5)  # OTP valid for 5 minutes

    otp_store[email] = {'otp': otp, 'expires': expiry_time}

    # send email
    msg = Message('Your OTP Code', sender=("AgriBridge", os.getenv("EMAIL_USER")), recipients=[email])
    msg.body = f"Your OTP is {otp}. It expires in 5 minutes."
    try:
        mail.send(msg)
        return jsonify({'message': 'OTP sent successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json() or request.form
    email = data.get('email')
    user_otp = data.get('otp')

    if email not in otp_store:
        return jsonify({'error': 'No OTP sent to this email'}), 400

    stored_otp = otp_store[email]['otp']
    expires = otp_store[email]['expires']

    if datetime.now() > expires:
        del otp_store[email]
        return jsonify({'error': 'OTP expired'}), 400

    if user_otp == stored_otp:
        del otp_store[email]  # OTP used, remove it
        return jsonify({'message': 'OTP verified successfully'})
    else:
        return jsonify({'error': 'Invalid OTP'}), 400

@app.route('/api/check-space', methods=['POST'])
def check_space():
    # Dummy logic: assume space is available if less than 10 requests
    available = len(farmer_requests) < 10
    return jsonify({'space_available': available}), 200

@app.route('/api/submit-storage', methods=['POST'])
def submit_storage():
    data = request.json
    farmer_name = data.get('farmer_name')
    crop_name = data.get('crop_name')
    quantity = data.get('quantity')
    email = data.get('email')
    if not farmer_name or not crop_name or not quantity or not email:
        return jsonify({'error': 'Farmer name, crop name, quantity, and email required'}), 400

    request_id = len(farmer_requests) + 1
    farmer_requests.append({
        'id': request_id,
        'farmer_name': farmer_name,
        'crop_name': crop_name,
        'quantity': quantity,
        'email': email,
        'condition': 'Pending'
    })
    return jsonify({'message': 'Request submitted successfully. Cold storage will review and update the condition.'}), 200

@app.route('/api/crop-condition', methods=['GET'])
def crop_condition():
    # Dummy condition data
    return jsonify({'message': 'Crop condition is good. Temperature: 5°C, Humidity: 60%'}), 200

@app.route('/api/cold-storage-login', methods=['POST'])
def cold_storage_login():
    data = request.json
    secret_code = data.get('secret_code')
    if secret_code == 'coldstorage123':  # Dummy secret code
        return jsonify({'message': 'Login successful'}), 200
    else:
        return jsonify({'error': 'Invalid secret code'}), 400

@app.route('/api/get-farmer-requests', methods=['GET'])
def get_farmer_requests():
    email = request.args.get('email')
    if email:
        filtered_requests = [req for req in farmer_requests if req.get('email') == email]
        return jsonify(filtered_requests), 200
    return jsonify(farmer_requests), 200

@app.route('/api/update-condition', methods=['POST'])
def update_condition():
    data = request.json
    request_id = data.get('request_id')
    condition = data.get('condition')
    for req in farmer_requests:
        if req['id'] == request_id:
            req['condition'] = condition
            return jsonify({'message': 'Condition updated'}), 200
    return jsonify({'error': 'Request not found'}), 404

@app.route('/api/wholesaler-login', methods=['POST'])
def wholesaler_login():
    data = request.json
    wholesaler_id = data.get('wholesaler_id')
    if wholesaler_id in wholesalers:
        return jsonify({'message': 'Login successful'}), 200
    else:
        return jsonify({'error': 'Invalid wholesaler ID'}), 400

@app.route('/api/get-wholesaler-details', methods=['GET'])
def get_wholesaler_details():
    wholesaler_id = request.args.get('id')
    if wholesaler_id in wholesalers:
        return jsonify(wholesalers[wholesaler_id]), 200
    else:
        return jsonify({'error': 'Wholesaler not found'}), 404

@app.route('/api/update-wholesaler-details', methods=['POST'])
def update_wholesaler_details():
    data = request.json
    wholesaler_id = data.get('wholesaler_id')
    if wholesaler_id in wholesalers:
        wholesalers[wholesaler_id].update({
            'name': data.get('name'),
            'location': data.get('location'),
            'payment_procedure': data.get('payment_procedure')
        })
        return jsonify({'message': 'Details updated'}), 200
    else:
        return jsonify({'error': 'Wholesaler not found'}), 404

@app.route('/api/get-crops-for-pricing', methods=['GET'])
def get_crops_for_pricing():
    # Dummy crop list
    crops = ['Wheat', 'Rice', 'Maize', 'Potato', 'Tomato']
    return jsonify(crops), 200

@app.route('/api/update-prices', methods=['POST'])
def update_prices():
    data = request.json
    wholesaler_id = data.get('wholesaler_id')
    prices = data.get('prices')
    if wholesaler_id in wholesalers:
        crop_prices[wholesaler_id] = prices
        return jsonify({'message': 'Prices updated'}), 200
    else:
        return jsonify({'error': 'Wholesaler not found'}), 404

@app.route('/api/get-market-prices', methods=['GET'])
def get_market_prices():
    # This now returns the centrally fetched market prices
    return jsonify(market_prices_store), 200

@app.route("/api/payment-status", methods=["POST"])
def payment_status():
    data = request.json
    # Save payment info to our in-memory list
    payments.append(data)
    return jsonify({"message": "Payment info recorded"})

@app.route('/api/get-test-otp', methods=['GET'])
def get_test_otp():
    email = request.args.get('email')
    if email in otp_store:
        return jsonify({'otp': otp_store[email]['otp']}), 200
    return jsonify({'error': 'No OTP found'}), 404

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

def fetch_and_update_market_prices():
    """
    Fetches real-time market prices from an external API (e.g., Agmarknet)
    and updates the central price store.
    """
    global market_prices_store
    
    # Store old prices to compare for changes
    old_prices = {item['crop_name']: item['price'] for item in market_prices_store}

    try:
        # NOTE: This is a placeholder URL. You must verify and use the correct, working API endpoint.
        # For testing, you can use a mock API service that returns data in your expected format.
        api_url = "http://api.agmarknet.gov.in/v1/marketprices"
        # It's good practice to set a timeout for external API calls.
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        api_data = response.json()

        new_prices = []
        # IMPORTANT: Adjust the keys ('commodity', 'price', 'arrival_date') based on the actual API response.
        for item in api_data.get('records', []): # Assuming the data is in a 'records' key
            crop_name = item.get('commodity')
            current_price = float(item.get('price', 0))
            
            change = 0 # 0 for no change, 1 for up, -1 for down
            if crop_name in old_prices:
                if current_price > old_prices[crop_name]:
                    change = 1
                elif current_price < old_prices[crop_name]:
                    change = -1

            new_prices.append({
                'crop_name': item['commodity'],
                'price': float(item['price']),
                'last_updated': item['arrival_date'],
                'change': change
            })
        
        market_prices_store = new_prices
        print(f"Successfully fetched and processed market prices at {datetime.now()}")

    except requests.exceptions.Timeout:
        print(f"Error: The request to the market API timed out.")
        return
    except requests.exceptions.RequestException as e: # Catches connection errors, 404s, 500s etc.
        print(f"Error fetching market prices from API: {e}. Using cached data if available.")
        return  # Exit the function if fetching fails

    socketio.emit('price_update', market_prices_store)

if __name__ == '__main__':
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=fetch_and_update_market_prices, trigger="interval", minutes=15)
    scheduler.start()
    fetch_and_update_market_prices() # Run once on startup
    socketio.run(app, debug=True)
