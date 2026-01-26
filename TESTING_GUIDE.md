# Authentication System Testing Guide

## Quick Test Commands (For Backend Testing)

### Test 1: Signup with Valid Password
```bash
curl -X POST http://localhost:5000/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "TEST@EMAIL.COM",
    "phone": "9876543210",
    "password": "SecurePass@123"
  }'
```

**Expected**: User created with email stored as "test@email.com" (lowercase)

---

### Test 2: Signup with Invalid Password (Missing Uppercase)
```bash
curl -X POST http://localhost:5000/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@email.com",
    "phone": "9876543210",
    "password": "securepass@123"
  }'
```

**Expected Error**: "Password must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character"

---

### Test 3: Signup with Invalid Password (Too Short)
```bash
curl -X POST http://localhost:5000/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@email.com",
    "phone": "9876543210",
    "password": "Pass@1"
  }'
```

**Expected Error**: "Password must be at least 8 characters long"

---

### Test 4: Direct Login (No OTP)
```bash
curl -X POST http://localhost:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@email.com",
    "password": "SecurePass@123"
  }'
```

**Expected**: Immediate token returned, no OTP step required

---

### Test 5: Login with Different Case Email
```bash
curl -X POST http://localhost:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "TEST@EMAIL.COM",
    "password": "SecurePass@123"
  }'
```

**Expected**: Login succeeds (case-insensitive)

---

### Test 6: Forgot Password - Request OTP
```bash
curl -X POST http://localhost:5000/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@email.com"
  }'
```

**Expected**: 
- OTP sent to email (or logged in dev console)
- OTP expires in 2 minutes
- Previous OTP is deleted

**Dev Console Output**:
```
[dev-otp] forgot-password OTP for test@email.com: 123456
```

---

### Test 7: Forgot Password - Resend OTP (Old OTP Should Expire)
First request OTP:
```bash
curl -X POST http://localhost:5000/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@email.com"}'
```

Then immediately resend (old OTP auto-deleted):
```bash
curl -X POST http://localhost:5000/api/user/forgot-password/resend \
  -H "Content-Type: application/json" \
  -d '{"email": "test@email.com"}'
```

**Expected**:
- New OTP issued
- First OTP is now invalid
- Second OTP should be used for reset

---

### Test 8: Reset Password with Invalid OTP
```bash
curl -X POST http://localhost:5000/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@email.com",
    "otp": "000000",
    "newPassword": "NewSecurePass@456"
  }'
```

**Expected Error**: "Invalid OTP"

---

### Test 9: Reset Password with Expired OTP (After 2 minutes)
1. Request OTP: `POST /forgot-password`
2. Wait 120+ seconds
3. Try to reset:

```bash
curl -X POST http://localhost:5000/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@email.com",
    "otp": "123456",
    "newPassword": "NewSecurePass@456"
  }'
```

**Expected Error**: "OTP not found or expired"

---

### Test 10: Reset Password with Valid OTP
```bash
curl -X POST http://localhost:5000/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@email.com",
    "otp": "123456",
    "newPassword": "NewSecurePass@456"
  }'
```

**Expected**: Password reset successful, OTP deleted

---

### Test 11: Reset Password with Invalid Password
```bash
curl -X POST http://localhost:5000/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@email.com",
    "otp": "123456",
    "newPassword": "weak"
  }'
```

**Expected Error**: "Password must be at least 8 characters long"

---

## Frontend Testing Checklist

### Login Page (`/login`)
- [ ] Can enter email and password
- [ ] Submit directly logs in (NO OTP modal)
- [ ] Invalid credentials show error
- [ ] Remember me checkbox works
- [ ] Forgot password link navigates to `/forgot-password`
- [ ] Shows loading state while submitting

### Forgot Password Page (`/forgot-password`)
- [ ] Can enter email
- [ ] Clicking Submit sends OTP
- [ ] Redirects to `/reset-password` page
- [ ] Email is passed via state

### Reset Password Page (`/reset-password`)
- [ ] Shows email, OTP, password, confirm password fields
- [ ] Password strength indicator works:
  - [ ] Shows "Weak" with weak password
  - [ ] Shows "Fair" with fair password
  - [ ] Shows "Good" with good password
  - [ ] Shows "Strong" with strong password
  - [ ] Shows "Very Strong" with very strong password
- [ ] Confirm password field shows:
  - [ ] Red border if passwords don't match
  - [ ] Green border with "✓" if passwords match
  - [ ] Error message "Passwords do not match"
  - [ ] Success message "Passwords match ✓"
- [ ] Submit button disabled until:
  - [ ] Passwords match
  - [ ] Password strength is at least "Good" (score ≥ 3)
- [ ] Resend button sends new OTP
- [ ] Can reset password successfully
- [ ] Redirects to login after successful reset
- [ ] Shows error for invalid OTP
- [ ] Shows error for expired OTP

### Change Password Page (`/change-password`) - if accessible
- [ ] Shows current password field
- [ ] Shows new password field
- [ ] Shows confirm password field
- [ ] Password validation applies to new password
- [ ] Confirm password validation works
- [ ] Can change password successfully
- [ ] Shows error if current password is incorrect
- [ ] Shows error if passwords don't match

---

## Database Verification

### Check Email Storage (Lowercase)
```javascript
// MongoDB query
db.user_tbls.findOne({ email: "test@email.com" })

// Should show:
// { _id: ObjectId(...), email: "test@email.com", ... }
// NOT: "TEST@EMAIL.COM" or "Test@Email.com"
```

### Check OTP Expiry
```javascript
// MongoDB query
db.otp_tbls.findOne({ email: "test@email.com" })

// Should have:
// { 
//   email: "test@email.com",
//   otpHash: "bcrypt_hash...",
//   purpose: "forgot",
//   expiresAt: ISODate("2024-01-25T10:05:00Z"),  // 2 mins from creation
//   createdAt: ISODate("2024-01-25T10:03:00Z"),
//   updatedAt: ISODate("2024-01-25T10:03:00Z")
// }
```

### Verify OTP Deletion on Resend
```javascript
// Before resend:
db.otp_tbls.countDocuments({ email: "test@email.com", purpose: "forgot" })
// Returns: 1

// After resend:
db.otp_tbls.countDocuments({ email: "test@email.com", purpose: "forgot" })
// Returns: 1 (new one, old one deleted)
```

---

## Implementation Details Reference

### Password Regex Pattern
```
^                          - Start of string
(?=.*[a-z])                - Lookahead: must contain lowercase
(?=.*[A-Z])                - Lookahead: must contain uppercase
(?=.*\d)                   - Lookahead: must contain digit
(?=.*[@$!%*?&])            - Lookahead: must contain special char
[A-Za-z\d@$!%*?&]{8,}      - 8+ characters from allowed set
$                          - End of string
```

### Valid Test Passwords
- ✅ `SecurePass@123`
- ✅ `MyPassword@456`
- ✅ `TestPass#789`
- ✅ `Admin$2024Pass`

### Invalid Test Passwords
- ❌ `noupppercase@123` (no uppercase)
- ❌ `NOLOWERCASE@123` (no lowercase)
- ❌ `NoDigits@Pass` (no digit)
- ❌ `NoSpecial123` (no special character)
- ❌ `Short@1` (too short, < 8 chars)

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Requires OTP | Auth Required |
|----------|--------|---------|--------------|---------------|
| `/api/user/signup` | POST | User registration | No | No |
| `/api/user/login` | POST | User login | No | No |
| `/api/user/forgot-password` | POST | Request password reset OTP | No | No |
| `/api/user/forgot-password/resend` | POST | Resend password reset OTP | No | No |
| `/api/user/reset-password` | POST | Reset password with OTP | Yes | No |
| `/api/user/change-password` | POST | Change password (authenticated) | No | Yes |

---

## Common Issues & Solutions

### Issue: Email stored with mixed case
**Solution**: Verify `lowercase: true` is in User and Otp models

### Issue: OTP not expiring
**Solution**: Check `expiresAt: { $gte: new Date() }` in queries

### Issue: Old OTP still working after resend
**Solution**: Verify `await Otp.deleteMany()` is called in `forgotPasswordRequest` and `resendForgotOtp`

### Issue: Password validation not working
**Solution**: Verify PASSWORD_REGEX pattern has correct lookaheads and `{8,}` at end

### Issue: Login still requires OTP
**Solution**: Check `login()` in AuthContext calls `/api/user/login` not `/api/user/login/request`

### Issue: Frontend showing OTP modal on login
**Solution**: Verify OTP routes are removed from `authRoutes.js`

---

## Performance Notes

1. **Email Index**: Added `index: true` to email fields for faster lookups
2. **Email Lowercase**: Done at model level (Mongoose handles it before storing)
3. **OTP Cleanup**: Auto-deletion of old OTPs prevents database bloat
4. **Password Hashing**: Uses bcryptjs for security (10 salt rounds)
5. **JWT Token**: 7-day expiration for session management

---

## Security Verification

✅ Passwords never stored in plaintext (bcryptjs hash)
✅ OTP hashed before storing in database
✅ Email case-insensitive prevents user enumeration
✅ OTP expires after 2 minutes (time-based TTL)
✅ Invalid OTP response doesn't reveal if email exists
✅ Rate limiting on OTP requests (otpRateLimiter middleware)
✅ JWT requires authentication for change-password endpoint
✅ Password strength enforced (uppercase, lowercase, digit, special char)
