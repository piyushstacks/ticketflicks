# Theatre Registration - Testing Guide

## Quick Test Workflow

### 1. Start the Application
```bash
# Terminal 1 - Backend
cd server
npm run server

# Terminal 2 - Frontend
cd client
npm run dev
```

### 2. Navigate to Theatres Page
- Open: `http://localhost:5173/theatres`
- Look for "Apply as Theatre" button
- Click to open registration modal

### 3. Test Step 1 - Manager Information

**Test Case 1: Empty Fields**
- Click "Next" without filling anything
- Expected: Error messages appear under each field
  - "Manager name is required"
  - "Manager email is required"
  - "Phone number is required"
  - "Password is required"

**Test Case 2: Invalid Email**
- Name: `John Doe`
- Email: `invalid-email` (no @)
- Phone: `+91 XXXXX XXXXX`
- Password: `Password123`
- Confirm: `Password123`
- Expected: Error: "Please enter a valid email address"

**Test Case 3: Short Password**
- Name: `John Doe`
- Email: `john@theatre.com`
- Phone: `+91 XXXXX XXXXX`
- Password: `pass` (less than 6 chars)
- Confirm: `pass`
- Expected: Error: "Password must be at least 6 characters"

**Test Case 4: Password Mismatch**
- Name: `John Doe`
- Email: `john@theatre.com`
- Phone: `+91 XXXXX XXXXX`
- Password: `Password123`
- Confirm: `Password456`
- Expected: Error: "Passwords do not match"

**Test Case 5: Valid Manager Info**
- Name: `John Doe`
- Email: `john@theatre.com`
- Phone: `+91 9876543210`
- Password: `Password123`
- Confirm: `Password123`
- Click "Next: Theatre Details →"
- Expected: Proceeds to Step 2 (no errors)

### 4. Test Step 2 - Theatre Information

**Test Case 6: Empty Fields**
- All fields empty
- Click "Next: Add Screens →"
- Expected: Error messages appear
  - "Theatre name is required"
  - "Location is required"
  - "Contact number is required"

**Test Case 7: Invalid Phone**
- Name: `PVR Cinemas`
- Location: `Bandra, Mumbai`
- Contact: `123` (too short)
- Click "Next"
- Expected: Error: "Please enter a valid phone number"

**Test Case 8: Valid Theatre Info**
- Name: `PVR Cinemas`
- Location: `Bandra, Mumbai`
- Contact: `+91 9876543210`
- Click "Next: Add Screens →"
- Expected: Proceeds to Step 3

**Test Case 9: Back Button**
- Click "← Back"
- Expected: Returns to Step 1 with data preserved

### 5. Test Step 3 - Screen Management

**Test Case 10: Empty Screen Fields**
- All screen fields empty
- Click "Add Screen"
- Expected: Error messages appear
  - "Screen name is required"
  - "Screen capacity must be greater than 0"
  - "Number of rows must be greater than 0"
  - "Seats per row must be greater than 0"

**Test Case 11: Invalid Capacity**
- Screen Name: `Screen A`
- Capacity: `0` or negative
- Rows: `12`
- Seats/Row: `20`
- Click "Add Screen"
- Expected: Error: "Screen capacity must be greater than 0"

**Test Case 12: Add Valid Screen**
- Screen Name: `Screen A`
- Capacity: `240`
- Rows: `12`
- Seats/Row: `20`
- Click "Add Screen"
- Expected:
  - Toast: "Screen 'Screen A' added successfully"
  - Screen appears in "Added Screens" list
  - Form clears for next screen

**Test Case 13: Verify Seat Layout**
- After adding screen, verify layout shows: "Capacity: 240 | Layout: 12x20"
- Expected: Correct calculation (rows × seats/row)

**Test Case 14: Add Multiple Screens**
- Add Screen A: 12×20 (240 seats)
- Add Screen B: 15×18 (270 seats)
- Add Screen C: 10×16 (160 seats)
- Expected: All three screens appear in the list

**Test Case 15: Remove Screen**
- After adding screens, click delete button on one
- Expected:
  - Screen removed from list
  - Toast: "Screen removed"
  - Count updates

**Test Case 16: Try Submit Without Screens**
- Remove all screens
- Click "Complete Registration"
- Expected: Toast error: "At least one screen is required"

**Test Case 17: Successful Registration**
- With all fields filled and at least 1 screen:
  - Manager: John Doe, john@theatre.com, +91 9876543210, Password123
  - Theatre: PVR Cinemas, Bandra, +91 9876543210
  - Screens: Screen A (12×20)
- Click "Complete Registration"
- Expected:
  - Loading state shows "Registering..."
  - Success toast: "Theatre registered successfully!"
  - Modal closes automatically
  - Returns to Theatres page

### 6. Test Error Cases

**Test Case 18: Duplicate Email**
- Register with email: `duplicate@theatre.com`
- Try to register again with same email
- Expected: Error toast: "Email already registered"
- Modal stays open on Step 1

**Test Case 19: Network Error**
- Disable network (DevTools → Network → Offline)
- Try to submit
- Expected: Error toast displayed

## Validation Rules Reference

| Field | Min | Max | Format | Required |
|-------|-----|-----|--------|----------|
| Name | 1 | - | Any text | Yes |
| Email | - | - | valid@email.com | Yes |
| Phone | 10 | - | Digits + common formats | Yes |
| Password | 6 | - | Any characters | Yes |
| Theatre Name | 1 | - | Any text | Yes |
| Location | 1 | - | Any text | Yes |
| Theatre Contact | 10 | - | Phone format | Yes |
| Screen Name | 1 | - | Any text | Yes |
| Capacity | 1 | - | Positive number | Yes |
| Rows | 1 | - | Positive number | Yes |
| Seats/Row | 1 | - | Positive number | Yes |

## Expected API Calls

### POST /api/theatre/register

**Request:**
```json
{
  "manager": {
    "name": "John Doe",
    "email": "john@theatre.com",
    "phone": "+91 9876543210",
    "password": "Password123"
  },
  "theatre": {
    "name": "PVR Cinemas",
    "location": "Bandra, Mumbai",
    "contact_no": "+91 9876543210"
  },
  "screens": [
    {
      "name": "Screen A",
      "capacity": 240,
      "seat_layout": [
        ["A1", "A2", "A3", ..., "A20"],
        ["B1", "B2", "B3", ..., "B20"],
        ...
        ["L1", "L2", "L3", ..., "L20"]
      ]
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Theatre registered successfully",
  "data": {
    "manager": {
      "id": "12345",
      "name": "John Doe",
      "email": "john@theatre.com",
      "phone": "+91 9876543210",
      "role": "manager"
    },
    "theatre": {
      "_id": "67890",
      "name": "PVR Cinemas",
      "location": "Bandra, Mumbai",
      "contact_no": "+91 9876543210",
      "manager_id": "12345",
      "screens": [...]
    }
  }
}
```

**Error Response (400/409/500):**
```json
{
  "success": false,
  "message": "Specific error message",
  "error": "Detailed error info"
}
```

## Browser Console Checks

- [ ] No errors in console during registration
- [ ] No warnings about missing dependencies
- [ ] API call logs show correct payload
- [ ] Network tab shows 201 response
- [ ] No React Fast Refresh warnings

## Database Verification

After successful registration, verify in MongoDB:

```javascript
// Check User was created
db.users.findOne({ email: "john@theatre.com" })
// Should show:
// - name, email, phone
// - password (hashed, not plaintext)
// - role: "manager"
// - no password: plaintext

// Check Theatre was created
db.theatres.findOne({ name: "PVR Cinemas" })
// Should show:
// - name, location, contact_no
// - manager_id (linked to user)
// - screens array with layout data

// Check screens were created
db.theatres.findOne({ name: "PVR Cinemas" }).screens
// Should show multiple screens with seat_layout arrays
```

## Performance Checks

- [ ] Modal loads without lag
- [ ] Input validation is instant (no delay)
- [ ] Switching between steps is smooth
- [ ] Adding/removing screens is responsive
- [ ] Registration submits within 2-3 seconds
- [ ] Success notification displays clearly

## Accessibility Checks

- [ ] All form fields have labels
- [ ] Error messages are clearly visible
- [ ] Buttons have hover states
- [ ] No color-only error indication
- [ ] Tab navigation works through form
- [ ] Mobile keyboard dismisses properly

## Clean Up Test Data

After testing, you can delete test records:

```javascript
// Remove test user
db.users.deleteOne({ email: "john@theatre.com" })

// Remove test theatre
db.theatres.deleteOne({ name: "PVR Cinemas" })
```

## Known Limitations

- Email verification not yet implemented (future feature)
- No resend email capability
- Theatre cannot be edited after creation (future feature)
- No bulk theatre import (future feature)

---

**Testing Status:** Ready for QA
**Last Updated:** January 16, 2025
