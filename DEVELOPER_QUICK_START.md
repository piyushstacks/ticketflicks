# Backend Developer Quick Start Guide

## Project Structure

```
server/
├── models/              # Database schemas with validation
│   ├── User.js         # ✅ Fixed
│   ├── Booking.js      # ✅ Fixed
│   ├── show_tbls.js    # ✅ Fixed
│   ├── Movie.js        # ✅ Fixed
│   └── Theatre.js      # ✅ Fixed
│
├── services/           # Business logic (NEW)
│   ├── validationService.js   # ✅ Input validation
│   ├── errorService.js        # ✅ Error handling
│   ├── authService.js         # ✅ Authentication
│   ├── userService.js         # ✅ User management
│   ├── bookingService.js      # ✅ Booking logic
│   └── theatreService.js      # ✅ Theatre management
│
├── controllers/        # HTTP request/response
│   ├── authController.js          # ✅ Refactored
│   ├── userController.js          # ✅ Refactored
│   ├── bookingController.js       # TODO: Refactor
│   ├── theatreController.js       # TODO: Refactor
│   ├── adminController.js         # TODO: Refactor
│   ├── adminMovieController.js    # TODO: Refactor
│   └── managerController.js       # TODO: Refactor
│
├── routes/             # API endpoints with middleware
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── bookingRoutes.js
│   ├── adminRoutes.js
│   └── ... (other routes)
│
├── middleware/         # Request/response processing
│   ├── errorHandler.js     # ✅ Global error handling
│   ├── authMiddleware.js   # ✅ JWT verification & roles
│   └── ... (other middleware)
│
└── server.js           # ✅ Main app setup with middleware
```

---

## Architecture Principles

### 1. Services Handle Business Logic
```javascript
// ✅ GOOD: Service contains business logic
export const createBooking = async (userId, showId, seats) => {
  // Validation
  // Availability check
  // Pricing calculation
  // Database operation
  // Return formatted result
};

// ❌ BAD: Putting logic in controller
export const createBooking = async (req, res) => {
  const booking = await Booking.create(req.body);
  res.json(booking);
};
```

### 2. Controllers Handle HTTP Only
```javascript
// ✅ GOOD: Controller delegates to service
export const createBooking = asyncHandler(async (req, res) => {
  const { showId, selectedSeats } = req.body;
  const result = await bookingService.createBooking(req.user.id, showId, selectedSeats);
  res.json({ success: true, data: result });
});

// ❌ BAD: Controller has business logic
export const createBooking = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const availability = await checkAvailability(showId, seats);
    if (!availability) { /* ... */ }
    const pricing = calculatePrice(seats);
    const booking = await Booking.create({ /* ... */ });
    res.json(booking);
  } catch (error) {
    // error handling
  }
};
```

### 3. Validation is Centralized
```javascript
// ✅ GOOD: Use validation service
import { validatePassword, validateEmail } from '../services/validationService.js';

const validation = validatePassword(password);
if (!validation.valid) {
  throw new ValidationError(validation.message);
}

// ❌ BAD: Validation scattered everywhere
if (!password || password.length < 8 || !/[A-Z]/.test(password)) {
  // ... validation logic
}
```

### 4. Error Handling is Consistent
```javascript
// ✅ GOOD: Use service errors and asyncHandler
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError, NotFoundError } from '../services/errorService.js';

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUserProfile(req.user.id, req.body);
  res.json({ success: true, user });
});

// ❌ BAD: Mixed error handling
export const updateUser = async (req, res) => {
  try {
    // ...
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: "Duplicate" });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
```

---

## How to Add a New Feature

### Step 1: Design the Service
```javascript
// services/paymentService.js
import { ValidationError, NotFoundError } from './errorService.js';
import Booking from '../models/Booking.js';

export const processPayment = async (bookingId, paymentInfo) => {
  // Validate input
  if (!bookingId || !paymentInfo) {
    throw new ValidationError("Booking ID and payment info are required");
  }
  
  // Get booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError("Booking");
  }
  
  // Process payment logic
  const paymentResult = await stripeInstance.processPayment(/* ... */);
  
  // Update booking
  booking.payment_status = "completed";
  booking.payment_id = paymentResult.id;
  await booking.save();
  
  return { success: true, paymentId: paymentResult.id };
};

export default { processPayment };
```

### Step 2: Create Controller
```javascript
// controllers/paymentController.js
import paymentService from '../services/paymentService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const processPayment = asyncHandler(async (req, res) => {
  const { bookingId, paymentInfo } = req.body;
  const result = await paymentService.processPayment(bookingId, paymentInfo);
  res.json({ success: true, ...result });
});

export default { processPayment };
```

### Step 3: Add Route
```javascript
// routes/paymentRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { processPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/process', verifyToken, processPayment);

export default router;
```

### Step 4: Mount Route in server.js
```javascript
import paymentRouter from './routes/paymentRoutes.js';

app.use('/api/payment', paymentRouter);
```

---

## Testing a Controller

### Using curl
```bash
# Test with authentication
curl -X POST http://localhost:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"New Name"}'

# Check response
# Should return: { "success": true, "user": {...} }
```

### Using Postman
1. Set `{{baseUrl}}` = `http://localhost:3000`
2. Set `{{token}}` = token from login response
3. Create request with:
   - Method: POST
   - URL: `{{baseUrl}}/api/user/profile`
   - Headers: `Authorization: Bearer {{token}}`
   - Body: Raw JSON

---

## Common Patterns

### Pattern 1: Async Handler with Service
```javascript
export const myEndpoint = asyncHandler(async (req, res) => {
  const result = await myService.doSomething(req.body);
  res.json({ success: true, data: result });
});
```

### Pattern 2: Admin-Only Endpoint
```javascript
import { requireAdmin } from '../middleware/authMiddleware.js';

router.post('/admin-action', verifyToken, requireAdmin, myController.action);
```

### Pattern 3: Role-Based Access
```javascript
import { requireRole } from '../middleware/authMiddleware.js';

router.post('/manager-action', verifyToken, requireRole(['manager', 'admin']), controller.action);
```

### Pattern 4: Input Validation
```javascript
const validation = validatePassword(password);
if (!validation.valid) {
  throw new ValidationError(validation.message);
}
```

### Pattern 5: Service with Proper Error Handling
```javascript
export const getUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }
  return user;
};
```

---

## Debugging Tips

### Enable Debug Logging
```bash
DEBUG=* npm start
```

### Check Service Directly
```javascript
// In node console
import userService from './services/userService.js';
const user = await userService.getUserProfile('user-id-here');
console.log(user);
```

### Database Query Debugging
```javascript
// In service
console.log('Query:', User.find().explain());
```

### Error Details
```javascript
// Error object has:
error.message    // User-friendly message
error.code       // ERROR_CODE
error.status     // HTTP status
error.details    // Additional info
```

---

## Performance Optimization

### 1. Use Proper Indexes
```javascript
// In model
userSchema.index({ email: 1 });  // Single field
userSchema.index({ theatre_id: 1, createdAt: -1 });  // Compound
```

### 2. Select Only Needed Fields
```javascript
// ✅ GOOD: Lean query
const user = await User.findById(id).select('name email role -password_hash');

// ❌ BAD: Fetch everything
const user = await User.findById(id);
```

### 3. Pagination on List Endpoints
```javascript
export const getAllUsers = async (skip = 0, limit = 50) => {
  const users = await User.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
};
```

### 4. Use Lean Queries When Not Modifying
```javascript
// ✅ GOOD: Faster, returns plain object
const users = await User.find().lean();

// ❌ BAD: Slower, returns Mongoose documents
const users = await User.find();
```

---

## Common Mistakes

### ❌ Mistake 1: Business Logic in Controller
```javascript
// Don't do this:
export const createBooking = async (req, res) => {
  // Validation
  // Price calculation
  // Database operations
  // Response
};
```

### ✅ Solution: Use Services
```javascript
// Do this instead:
export const createBooking = asyncHandler(async (req, res) => {
  const result = await bookingService.createBooking(
    req.user.id,
    req.body.showId,
    req.body.seats
  );
  res.json({ success: true, data: result });
});
```

### ❌ Mistake 2: Inconsistent Error Handling
```javascript
// Don't mix error handling styles
throw new Error("Something failed");
throw new ValidationError("Invalid input");
return res.status(400).json({ message: "Error" });
```

### ✅ Solution: Use Error Service
```javascript
// Use consistent error classes
if (!isValid) {
  throw new ValidationError("Invalid input");
}
if (!found) {
  throw new NotFoundError("Resource");
}
```

### ❌ Mistake 3: No Input Validation
```javascript
// Don't trust user input
const user = await User.create(req.body);
```

### ✅ Solution: Validate First
```javascript
// Validate before processing
const validation = validateSignupData(req.body);
if (!validation.valid) {
  throw new ValidationError(validation.message);
}
const user = await authService.signup(req.body);
```

---

## Important Notes

⚠️ **Database Changes**:
- Never modify production data structure without migration
- Use additive changes (add fields, don't remove)
- Test migrations in staging first

⚠️ **Backward Compatibility**:
- Keep old endpoints working during transition
- Version API endpoints if possible
- Document breaking changes

⚠️ **Security**:
- Always validate user input
- Use proper authentication/authorization
- Never log sensitive data
- Sanitize error messages

⚠️ **Performance**:
- Add indexes for frequently queried fields
- Use pagination on list endpoints
- Avoid N+1 queries
- Select only needed fields

---

## Resources

- **API Documentation**: `BACKEND_API_DOCUMENTATION.md`
- **Implementation Status**: `BACKEND_IMPLEMENTATION_STATUS.md`
- **Analysis Report**: `BACKEND_CLEANUP_ANALYSIS.md`
- **Complete Summary**: `BACKEND_CLEANUP_COMPLETE_SUMMARY.md`

---

## Support

For questions or issues:
1. Check the documentation files
2. Review similar implementations
3. Check git history for similar changes
4. Test in development first

---

**Last Updated**: February 28, 2026
**Version**: 2.0.0 (Backend Redesign)
