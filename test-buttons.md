# Button Functionality Test Guide

## How to Debug Non-Working Buttons

### 1. Open Browser DevTools

- Press F12 or Right-click → Inspect
- Go to Console tab
- Go to Network tab

### 2. Test Each Button and Check:

#### Delete/Cancel Appointment Button

**Location:** Appointments page → Click action menu on appointment
**Expected API Call:** `DELETE /api/appointments/{id}` or `PATCH /api/appointments/{id}`
**Check for:**

- ❌ 401 Unauthorized - Auth token expired
- ❌ 403 Forbidden - Missing permissions
- ❌ 404 Not Found - Endpoint doesn't exist
- ❌ 500 Server Error - Backend error
- ✅ 200/204 Success

#### Move Intake Status (Pending → Reviewed → Completed)

**Location:** Intake Management → Click status change button
**Expected API Call:** `PATCH /api/intake/{id}/status`
**Payload:** `{ "status": "Reviewed" }` or `{ "status": "Completed" }`

### 3. Common Issues to Check:

**Console Errors:**

```javascript
// Look for these patterns:
- "Failed to fetch" - Network/CORS issue
- "401" - Authentication expired
- "undefined is not a function" - Missing handler
- "Cannot read property" - Null reference
```

**Network Tab:**

- Red requests = Failed
- Check Status Code column
- Click failed request → Preview tab to see error message

### 4. Quick Fixes:

**If Auth Token Expired:**

- Logout and login again
- Check localStorage for token

**If CORS Error:**

- Backend needs to allow frontend origin
- Check backend CORS configuration

**If Handler Missing:**

- Button onClick might not be wired up
- Check React DevTools for props

### 5. Test These Specific Buttons:

1. ✅ Delete Appointment
2. ✅ Cancel Appointment
3. ✅ Move Intake: Pending → Reviewed
4. ✅ Move Intake: Reviewed → Completed
5. ✅ Approve Intake
6. ✅ Reject Intake
7. ✅ Schedule from Intake

### 6. Report Findings:

For each broken button, note:

- Page name
- Button label
- Console error message
- Network request status code
- Request URL
- Response body (if any)
