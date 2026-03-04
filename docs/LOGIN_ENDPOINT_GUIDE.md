# Login Endpoint Guide

## Correct Endpoint Location

The login endpoint is available at:

```
POST /api/user/login
```

**Base URL:** `http://localhost:3000`
**Full URL:** `http://localhost:3000/api/user/login`

---

## Request Format

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## Example Request

### Using cURL
```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Using JavaScript/Fetch
```javascript
fetch('http://localhost:3000/api/user/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err))
```

### Using Axios
```javascript
axios.post('http://localhost:3000/api/user/login', {
  email: 'user@example.com',
  password: 'password123'
})
.then(res => console.log(res.data))
.catch(err => console.error(err.response.data))
```

---

## Expected Response

### Success (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id_here",
      "email": "user@example.com",
      "name": "User Name",
      "role": "customer"
    },
    "token": "jwt_token_here"
  }
}
```

### Error Examples

#### Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

#### User Not Found (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

#### Validation Error (400)
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

---

## Alternative Endpoints

### Also available at (for backward compatibility):
- `POST /api/auth/login` - Same functionality from authRoutes.js

### Other Auth Endpoints:
- `POST /api/user/signup` - Register new user
- `POST /api/user/signup/complete` - Complete signup with OTP
- `POST /api/user/forgot-password` - Request password reset
- `POST /api/user/reset-password` - Reset password with OTP
- `POST /api/user/change-password` - Change password (requires auth)

---

## Troubleshooting

### "Cannot POST /api/user/login"
- ✅ Server is running
- ✅ Using correct HTTP method (POST, not GET)
- ✅ Correct endpoint path

### "Invalid email or password"
- Check email and password are correct
- Verify user account exists in database
- Check password hasn't been changed

### "Email and password are required"
- Ensure both fields are in request body
- Check JSON format is valid
- Verify Content-Type header is application/json

### Server Returns 500 Error
- Check server logs for details
- Verify database is connected
- Ensure environment variables are set

---

**Updated:** 28 February 2026
**API Version:** 2.0.0
