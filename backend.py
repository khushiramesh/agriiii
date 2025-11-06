import os
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
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
crop_prices = {}

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
    msg = Message('Your OTP Code', sender=os.getenv("EMAIL_USER"), recipients=[email])
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
    prices_list = []
    for ws_id, prices in crop_prices.items():
        ws_details = wholesalers[ws_id]
        for crop, price in prices.items():
            prices_list.append({
                'crop_name': crop,
                'price': price,
                'name': ws_details['name'],
                'location': ws_details['location'],
                'location_url': f'https://www.google.com/maps/search/{ws_details["location"]}',
                'payment_procedure': ws_details['payment_procedure']
            })
    return jsonify(prices_list), 200

@app.route('/api/get-test-otp', methods=['GET'])
def get_test_otp():
    email = request.args.get('email')
    if email in otp_store:
        return jsonify({'otp': otp_store[email]['otp']}), 200
    return jsonify({'error': 'No OTP found'}), 404

if __name__ == '__main__':
    app.run(debug=True)
