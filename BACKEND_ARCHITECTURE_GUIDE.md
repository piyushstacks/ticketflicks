# Backend Architecture Quick Reference

## Service-Controller Pattern

### ✅ Correct Pattern (Now Used Throughout)
```javascript
// Service: business logic
export const getUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

// Controller: HTTP only
export const getUserController = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await getUser(userId);
  res.json({ success: true, user });
});
```

### ❌ Old Pattern (Avoid)
```javascript
export const getUserController = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
```

## Error Handling

### ✅ Service Layer (Throw AppError)
```javascript
import { AppError } from "./errorService.js";

export const createBooking = async (data) => {
  if (!data.showId) {
    throw new AppError("Show ID is required", 400);
  }
  
  const seats = await checkSeats(data.showId);
  if (seats.available <= 0) {
    throw new AppError("No seats available", 409);
  }
  
  return await Booking.create(data);
};
```

### ✅ Controller Layer (Use asyncHandler)
```javascript
import { asyncHandler } from "./errorService.js";

export const createBookingController = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.body);
  res.status(201).json({ success: true, booking });
});
```

### Global Error Handler
- Automatically catches all errors from asyncHandler
- Formats response consistently
- Logs errors properly
- Returns appropriate HTTP status codes

## Service Organization

### Core Services (8+)
```
/services/
  ├── validationService.js    # Input validation rules
  ├── errorService.js         # Error classes & asyncHandler
  ├── authService.js          # Auth operations
  ├── userService.js          # User operations
  ├── bookingService.js       # Booking operations
  ├── theatreService.js       # Theatre operations
  ├── movieService.js         # Movie operations
  ├── showService.js          # Show operations
  ├── screenService.js        # Screen operations
  ├── managerService.js       # Manager-specific
  └── managerShowService.js   # Manager shows
```

### Each Service
- Pure functions (no HTTP concerns)
- Throws AppError for failures
- Async/await for clarity
- Minimal dependencies
- Validates input
- Returns clean data

## Controller Organization

### Controller Pattern
```javascript
import * as serviceLayer from "../services/serviceLayer.js";
import { asyncHandler } from "../services/errorService.js";

export const endpoint = asyncHandler(async (req, res) => {
  // 1. Extract input
  const { param } = req.body;
  
  // 2. Call service
  const result = await serviceLayer.operation(param);
  
  // 3. Return response
  res.json({ success: true, data: result });
});
```

### Controllers Are NOT For
- ❌ Direct database queries
- ❌ Complex business logic
- ❌ Validation rules
- ❌ Error formatting
- ❌ try-catch blocks (asyncHandler handles this)

## Middleware

### Authentication
```javascript
// Protect any authenticated user
router.get('/profile', protect, userController.getProfile);

// Protect admin only
router.delete('/user/:id', protectAdmin, userController.deleteUser);

// Protect manager only
router.get('/dashboard', protectManager, managerController.dashboard);

// Protect customer only
router.post('/booking', protectCustomer, bookingController.create);
```

### Error Handler (Last in Chain)
```javascript
// routes/index.js
app.use(routes);          // All other routes
app.use(notFoundHandler); // 404 handler
app.use(globalErrorHandler); // Global error handler
```

## Response Format

### ✅ Success Response
```javascript
{
  success: true,
  data: { /* actual data */ },
  message?: "Optional message"
}
```

### ✅ Error Response
```javascript
{
  success: false,
  message: "User not found",
  statusCode: 404
}
```

### Status Codes
- 200 OK (default)
- 201 Created (POST success)
- 400 Bad Request (validation error)
- 401 Unauthorized (no/invalid token)
- 403 Forbidden (insufficient permissions)
- 404 Not Found (resource missing)
- 409 Conflict (duplicate, seats full, etc)
- 500 Internal Server Error

## Database Operations

### Safe Pattern
```javascript
// Always in service layer
export const getUserWithBookings = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  
  const bookings = await Booking.find({ user: userId });
  
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    bookings,
  };
};
```

### Never in Controller
```javascript
// ❌ DON'T DO THIS IN CONTROLLER
export const getUserWithBookings = async (req, res) => {
  const user = await User.findById(req.params.userId);
  const bookings = await Booking.find({ user: req.params.userId });
  res.json({ user, bookings });
};
```

## Adding New Features

### Step 1: Create Service
```javascript
// /services/newFeatureService.js
export const newOperation = async (data) => {
  // Validation
  if (!data.required) throw new AppError("Required field missing", 400);
  
  // Business logic
  const result = await Model.create(data);
  
  return result;
};
```

### Step 2: Create Controller
```javascript
// /controllers/newController.js
import * as newFeatureService from "../services/newFeatureService.js";
import { asyncHandler } from "../services/errorService.js";

export const newEndpoint = asyncHandler(async (req, res) => {
  const result = await newFeatureService.newOperation(req.body);
  res.status(201).json({ success: true, data: result });
});
```

### Step 3: Add Route
```javascript
// /routes/newRoutes.js
import { newEndpoint } from "../controllers/newController.js";
import { protect } from "../middleware/auth.js";

router.post('/new-endpoint', protect, newEndpoint);
```

## Testing Services

### ✅ Easy to Test
```javascript
// No HTTP, no dependencies on controllers
describe('bookingService', () => {
  it('should throw error if no seats', async () => {
    const booking = bookingService.createBooking({ showId: 'id' });
    expect(booking).rejects.toThrow('No seats available');
  });
});
```

### ❌ Hard to Test (Old Pattern)
```javascript
// Mixed concerns, HTTP dependencies
describe('bookingController', () => {
  it('should return 409 if no seats', async () => {
    const req = { body: { showId: 'id' } };
    const res = { json: jest.fn() };
    await bookingController.create(req, res);
    expect(res.json).toHaveBeenCalledWith({ success: false });
  });
});
```

## Common Mistakes to Avoid

### ❌ Mixing Concerns
```javascript
// DON'T: Database query in controller
export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
};

// ✅ DO: Query in service, HTTP in controller
export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json({ success: true, user });
});
```

### ❌ Inconsistent Errors
```javascript
// DON'T: Different error formats
if (!data) res.json({ error: "Missing data" });
else if (error) res.status(500).send(error);

// ✅ DO: Always throw AppError
if (!data) throw new AppError("Missing data", 400);
if (error) throw error; // asyncHandler catches it
```

### ❌ Validation in Controller
```javascript
// DON'T: Validation scattered
if (!email || !PASSWORD_REGEX.test(password)) {
  return res.json({ success: false });
}

// ✅ DO: Centralized validators
const validation = validationService.validateSignup(email, password);
if (!validation.valid) throw new AppError(validation.message, 400);
```

### ❌ Missing Error Handling
```javascript
// DON'T: Unhandled promise rejection
export const endpoint = async (req, res) => {
  await operation(); // If this fails, request hangs
};

// ✅ DO: Always wrap with asyncHandler
export const endpoint = asyncHandler(async (req, res) => {
  await operation(); // Error caught automatically
});
```

## Debugging

### Enable Detailed Logs
```javascript
// In service layer
export const operation = async (data) => {
  console.log("[operation] Starting with data:", data);
  
  const result = await Model.find(data);
  console.log("[operation] Database returned:", result);
  
  return result;
};
```

### Error Messages Help
```javascript
// ✅ Helpful error message
throw new AppError(
  `Seat ${seatNumber} in tier ${tierName} is already booked`,
  409
);

// ❌ Unhelpful
throw new AppError("Seat not available", 400);
```

## Performance Tips

### Use Service Caching
```javascript
const cache = new Map();

export const getMovies = async () => {
  if (cache.has('movies')) {
    return cache.get('movies');
  }
  
  const movies = await Movie.find();
  cache.set('movies', movies);
  return movies;
};
```

### Batch Database Queries
```javascript
// ✅ One query for 100 items
const users = await User.find({ _id: { $in: userIds } });

// ❌ 100 queries for 100 items
for (const id of userIds) {
  const user = await User.findById(id);
}
```

### Use Select to Limit Fields
```javascript
// ✅ Only get what you need
const users = await User.find().select('name email role');

// ❌ Get everything
const users = await User.find();
```

---

## Summary

| Aspect | Location | Responsibility |
|--------|----------|-----------------|
| Business Logic | Services | Do the work |
| HTTP Handling | Controllers | Receive & return HTTP |
| Input Validation | Services | Check data |
| Error Handling | Middleware | Catch & format |
| Authentication | Middleware | Verify user |
| Database | Services | Store & retrieve |

**Core Rule:** Controllers are thin, Services are thick.
