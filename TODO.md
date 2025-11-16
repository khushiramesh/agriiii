# TODO for Cold Storage Unit Management Interface

## Tasks
- [x] Modify cold-storage-dashboard.html: Change the requests list to display farmer requests with radio buttons for selecting one request at a time, remove the modal, and add a form below the list for entering condition details
- [x] Update app.js: Modify the cold storage dashboard logic to handle radio button selection (store selected request ID), and update the form submission to use the selected request ID for updating condition
- [ ] Test the interface: Run the app, login as cold storage, select a farmer, enter condition, save, then check farmer dashboard to verify condition is viewable

## Wholesaler Flow Tasks
- [x] Modify wholesaler-dashboard.html: Add branch info form (city, cold storage, trays)
- [x] Update backend.py: Add wholesaler_branches = {}, /api/submit-branch-info endpoint, /api/get_notifications endpoint
- [x] Modify farmer-dashboard.html: Add notifications display section
- [x] Update app.js: Handle branch info submission, fetch and display notifications on farmer dashboard
- [x] Test the wholesaler flow: Wholesaler login, submit branch info, check notifications on farmer dashboard
