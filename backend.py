import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE = os.getenv("TWILIO_PHONE_NUMBER")

twilio_client = Client(TWILIO_SID, TWILIO_AUTH)

app = Flask(__name__)
CORS(app)

# In-memory storage for demo purposes (replace with database in production)
otp_storage = {}
farmer_requests = []
wholesalers = {
    'WS001': {'name': 'Wholesaler A', 'location': 'Delhi', 'payment_procedure': 'Cash on Delivery'},
    'WS002': {'name': 'Wholesaler B', 'location': 'Mumbai', 'payment_procedure': 'Online Payment'}
}
crop_prices = {}

@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    phone = data.get('phone')
    if not phone:
        return jsonify({'error': 'Phone number required'}), 400

    # Generate a 6-digit OTP (for demo, in production use secure random)
    import random
    otp = str(random.randint(100000, 999999))
    otp_storage[phone] = otp

    # Send OTP via Twilio
    try:
        message = twilio_client.messages.create(
            body=f'Your OTP is: {otp}',
            from_=TWILIO_PHONE,
            to=f'+91{phone}'  # Assuming Indian numbers, adjust as needed
        )
        return jsonify({'message': 'OTP sent', 'otp_for_testing': otp}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    phone = data.get('phone')
    otp = data.get('otp')
    if not phone or not otp:
        return jsonify({'error': 'Phone and OTP required'}), 400

    if otp_storage.get(phone) == otp:
        del otp_storage[phone]
        return jsonify({'message': 'OTP verified'}), 200
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
    crop_name = data.get('crop_name')
    quantity = data.get('quantity')
    if not crop_name or not quantity:
        return jsonify({'error': 'Crop name and quantity required'}), 400

    request_id = len(farmer_requests) + 1
    farmer_requests.append({
        'id': request_id,
        'crop_name': crop_name,
        'quantity': quantity,
        'condition': 'Pending'
    })
    return jsonify({'message': 'Request submitted', 'request_id': request_id}), 200

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

if __name__ == '__main__':
    app.run(debug=True)
