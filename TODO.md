# TODO: Replace Twilio SMS OTP with Email OTP

## Steps to Complete
- [x] Backup backend.py
- [x] Remove Twilio usage from backend.py (imports, initialization, SMS lines)
- [x] Add email OTP helper functions to backend.py (generate_otp, send_email_otp)
- [x] Add Flask endpoints for send and verify email OTP to backend.py
- [x] Configure Flask session secret in backend.py
- [x] Update requirements.txt (remove twilio)
- [ ] Update .env.example with EMAIL_USER and EMAIL_PASS (Note: .env files cannot be edited directly - manual setup required)
- [x] Install required packages (pip install python-dotenv Flask)
- [x] Uninstall Twilio package
- [x] Test locally (start server and test endpoints) - Server running, but email sending failed due to missing .env credentials (requires manual .env setup for full testing)
