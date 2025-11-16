from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import random, sqlite3
from datetime import datetime

app = Flask(__name__)
app.secret_key = "your_secret_key"

# ------------------ DATABASE INIT ------------------
def init_db():
    conn = sqlite3.connect('agribridge.db')
    c = conn.cursor()
    
    # Wholesalers
    c.execute('''CREATE TABLE IF NOT EXISTS wholesalers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    email TEXT,
                    city TEXT,
                    cold_storage_available INTEGER,
                    trays_available INTEGER,
                    date_added TEXT
                )''')
    
    # Notifications for farmers
    c.execute('''CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message TEXT,
                    timestamp TEXT
                )''')

    conn.commit()
    conn.close()

init_db()

# ------------------ ROUTES ------------------

# Wholesaler Login Page
@app.route("/wholesaler")
def wholesaler():
    return render_template("wholesaler_login.html")

# Send OTP
@app.route("/wholesaler/send_otp", methods=["POST"])
def wholesaler_send_otp():
    name = request.form["name"]
    email = request.form["email"]

    session["wh_name"] = name
    session["wh_email_input"] = email

    # Generate OTP
    otp = random.randint(100000, 999999)
    session["wh_otp"] = str(otp)
    session["wh_otp_time"] = datetime.now().timestamp()

    print("Wholesaler OTP:", otp)  # for testing, replace with email later

    return render_template("wholesaler_otp.html", message="OTP sent successfully!")

# Verify OTP
@app.route("/wholesaler/verify_otp", methods=["POST"])
def wholesaler_verify_otp():
    user_otp = request.form["otp"]
    real_otp = session.get("wh_otp")
    otp_time = session.get("wh_otp_time")

    # Expiry check
    if datetime.now().timestamp() - otp_time > 180:
        return render_template("wholesaler_otp.html", error="OTP expired! Please resend again.")

    # Format check
    if len(user_otp) != 6 or not user_otp.isdigit():
        return render_template("wholesaler_otp.html", error="Invalid OTP! Must be 6 digits.")

    # Validate OTP
    if user_otp != real_otp:
        return render_template("wholesaler_otp.html", error="Incorrect OTP!")

    # Redirect to branch info
    return redirect(url_for("wholesaler_branch"))

# Wholesaler Branch Info
@app.route("/wholesaler/branch", methods=["GET", "POST"])
def wholesaler_branch():
    if request.method == "POST":
        name = session.get("wh_name")
        email = session.get("wh_email_input")
        city = request.form["city"]
        cold_storage = int(request.form["cold_storage"])
        trays = int(request.form["trays"])

        # Insert into DB
        conn = sqlite3.connect('agribridge.db')
        c = conn.cursor()
        c.execute("""INSERT INTO wholesalers
                     (name,email,city,cold_storage_available,trays_available,date_added)
                     VALUES (?,?,?,?,?,?)""",
                  (name,email,city,cold_storage,trays,datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        
        # Insert notification for farmers
        message = f"New wholesaler available in {city}! Cold Storage: {cold_storage}, Trays: {trays}"
        c.execute("INSERT INTO notifications (message, timestamp) VALUES (?, ?)",
                  (message, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        
        conn.commit()
        conn.close()

        return render_template("wholesaler_dashboard.html", name=name)

    return render_template("wholesaler_branch.html")

# Farmer notifications (to show new wholesaler info)
@app.route("/get_notifications")
def get_notifications():
    conn = sqlite3.connect('agribridge.db')
    c = conn.cursor()
    c.execute("SELECT message FROM notifications ORDER BY timestamp DESC LIMIT 10")
    notifications = c.fetchall()
    conn.close()
    return jsonify(notifications)

# ------------------ RUN APP ------------------
if __name__ == '__main__':
    app.run(debug=True)
