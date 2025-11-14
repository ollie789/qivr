# Patient Portal Frontend Integration Test

## Test URL
https://patients.qivr.pro

## Test Credentials
- **Email:** patient1762923257212@example.com
- **Password:** PatientPass123!

## Test Checklist

### 1. Authentication ✓
- [ ] Login page loads
- [ ] Can log in with test credentials
- [ ] Redirects to dashboard after login
- [ ] Can log out

### 2. Dashboard ✓
- [ ] Dashboard loads without errors
- [ ] Shows patient name/info
- [ ] Displays upcoming appointments
- [ ] Shows pending PROMs
- [ ] Navigation menu works

### 3. Appointments ✓
- [ ] Appointments page loads
- [ ] Shows list of appointments
- [ ] Can view appointment details
- [ ] Book appointment flow works

### 4. PROMs ✓
- [ ] PROMs page loads
- [ ] Shows available PROMs
- [ ] Can start a PROM
- [ ] Can complete a PROM

### 5. Messages ✓
- [ ] Messages page loads
- [ ] Shows message list
- [ ] Can read messages
- [ ] Can send messages

### 6. Documents ✓
- [ ] Documents page loads
- [ ] Shows document list
- [ ] Can view documents
- [ ] Can download documents

### 7. Profile ✓
- [ ] Profile page loads
- [ ] Shows patient information
- [ ] Can edit profile
- [ ] Changes save correctly

### 8. Medical Records ✓
- [ ] Medical records page loads
- [ ] Shows evaluations
- [ ] Can view evaluation details

## Known Issues
- None currently

## Backend API Status
All patient endpoints returning 200 OK ✅
