# 🚀 Theatre Registration - Quick Integration Guide

## What's New?

Added "Apply as Theatre" feature allowing users to register their cinemas on the TicketFlicks platform.

---

## 📁 Files Created/Updated

### Frontend Files

#### New Files:
- ✅ `client/src/components/TheatreRegistration.jsx` - Registration modal component

#### Updated Files:
- ✅ `client/src/pages/Theatres.jsx` - Added registration button and modal integration

### Backend Files

#### New Files:
- ✅ `server/controllers/theatreController.js` - Theatre management logic (9 functions)
- ✅ `server/models/Theatre.js` - Theatre schema definition
- ✅ `server/routes/theatreRoutes.js` - Theatre API routes (9 endpoints)

#### Updated Files:
- ✅ `server/models/User.js` - Added "manager" role to enum
- ✅ `server/server.js` - Added theatre router integration

---

## 🔧 Setup Steps

### Step 1: Frontend Integration

The frontend files are already created. Just ensure imports are working:

**In Theatres.jsx:**
```jsx
import TheatreRegistration from '../components/TheatreRegistration'
```

### Step 2: Backend Setup

The backend files are created. Add theatre router to server.js:

**In server.js (Already done):**
```javascript
import theatreRouter from "./routes/theatreRoutes.js";
app.use("/api/theatre", theatreRouter);
```

### Step 3: Database

Create MongoDB collection with validation:

```javascript
// In MongoDB Compass or MongoDB Shell:
db.createCollection("theatres", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "location", "manager_id", "screens"],
      properties: {
        name: { bsonType: "string" },
        location: { bsonType: "string" },
        manager_id: { bsonType: "objectId" },
        contact_no: { bsonType: "string" },
        screens: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["screen_id", "name", "capacity", "seat_layout"],
            properties: {
              screen_id: { bsonType: "objectId" },
              name: { bsonType: "string" },
              capacity: { bsonType: "int" },
              seat_layout: {
                bsonType: "array",
                items: { bsonType: "array", items: { bsonType: "string" } }
              }
            }
          }
        }
      }
    }
  }
});
```

---

## 🎯 How It Works

### User Flow:

1. **Navigate to Theatres Page**
   ```
   http://localhost:5173/theatres
   ```

2. **Click "Apply as Theatre" Button**
   - Button appears in top-right of page header
   - Next to "Find Your Theater" title

3. **Fill Theatre Details (Step 1)**
   - Theatre Name (e.g., "PVR Cinemas")
   - Location (e.g., "Bandra, Mumbai")
   - Contact Number (e.g., "+91-9876543210")

4. **Add Screens (Step 2)**
   - Screen Name (e.g., "Screen A")
   - Total Capacity (e.g., "240")
   - Number of Rows (e.g., "12")
   - Seats per Row (e.g., "20")
   - Click "Add Screen"
   - Repeat for multiple screens
   - Preview screens in list

5. **Submit Registration**
   - Click "Complete Registration"
   - API call to `POST /api/theatre/register`
   - Theatre created in MongoDB
   - User role updated to "manager"
   - Success notification shown
   - Modal closes

6. **Theatre Listed**
   - Theatre appears in theatres list
   - Customers can view and book tickets

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/theatre/` | ❌ | Get all theatres |
| GET | `/api/theatre/:id` | ❌ | Get single theatre |
| POST | `/api/theatre/register` | ✅ | Register new theatre |
| PUT | `/api/theatre/:id` | ✅ | Update theatre |
| DELETE | `/api/theatre/:id` | ✅ | Delete theatre |
| POST | `/api/theatre/:id/screen` | ✅ | Add screen |
| PUT | `/api/theatre/:id/screen/:screenIndex` | ✅ | Update screen |
| DELETE | `/api/theatre/:id/screen/:screenIndex` | ✅ | Delete screen |
| GET | `/api/theatre/manager/:managerId` | ✅ | Get manager's theatres |

---

## 💾 MongoDB Schema

**Theatre Document Structure:**

```json
{
  "_id": ObjectId,
  "name": "PVR Cinemas",
  "location": "Bandra, Mumbai",
  "manager_id": ObjectId,
  "contact_no": "+91-9876543210",
  "screens": [
    {
      "screen_id": ObjectId,
      "name": "Screen A",
      "capacity": 240,
      "seat_layout": [
        ["A1", "A2", "A3", ...],
        ["B1", "B2", "B3", ...],
        ...
      ]
    }
  ],
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

---

## 🧪 Testing

### Test in Postman:

**1. Register Theatre:**
```bash
POST http://localhost:3000/api/theatre/register
Headers: Authorization: Bearer {token}
Body:
{
  "name": "PVR Cinemas",
  "location": "Bandra, Mumbai",
  "contact_no": "+91-9876543210",
  "manager_id": "user_id_here",
  "screens": [
    {
      "name": "Screen A",
      "capacity": 240,
      "seat_layout": [
        ["A1", "A2", "A3"],
        ["B1", "B2", "B3"]
      ]
    }
  ]
}
```

**2. Fetch All Theatres:**
```bash
GET http://localhost:3000/api/theatre/
```

**3. Get Manager's Theatres:**
```bash
GET http://localhost:3000/api/theatre/manager/{managerId}
Headers: Authorization: Bearer {token}
```

### Test in Browser:

1. Open http://localhost:5173/theatres
2. Click "Apply as Theatre" button
3. Fill in theatre details
4. Add 2-3 screens
5. Submit form
6. Verify success message
7. Check theatres list updated

---

## ✨ Key Features

✅ **Step-by-step Registration Wizard**
- Easy-to-follow 2-step process
- Clear validation messages
- Loading states during submission

✅ **Screen Management**
- Add multiple screens
- Auto-generate seat layouts
- Preview screens before submission
- Remove screens if needed

✅ **Role Assignment**
- User automatically assigned "manager" role
- Can manage theatre and screens later

✅ **Responsive Design**
- Works on mobile, tablet, desktop
- Dark theme matching platform
- Smooth animations and transitions

✅ **Error Handling**
- Comprehensive validation
- User-friendly error messages
- Toast notifications for feedback

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Apply as Theatre" button not showing | Check Theatres.jsx imports and component integration |
| Modal not opening | Verify showRegistration state and onClick handler |
| Form submission fails | Check network tab, verify Bearer token is valid |
| Theatre not appearing in list | Check MongoDB collection exists and validation rules |
| API error 404 | Ensure server.js has `app.use("/api/theatre", theatreRouter)` |
| User role not updated | Check manager_id is valid MongoDB ObjectId |

---

## 📊 Component Architecture

```
Theatres.jsx
├── Button: "Apply as Theatre"
├── State: showRegistration (boolean)
└── TheatreRegistration Modal
    ├── Step 1: Basic Information
    │   ├── Input: Theatre name
    │   ├── Input: Location
    │   ├── Input: Contact number
    │   └── Button: Next
    └── Step 2: Screen Management
        ├── Screen Form
        │   ├── Input: Screen name
        │   ├── Input: Capacity
        │   ├── Input: Rows
        │   ├── Input: Seats per row
        │   └── Button: Add Screen
        ├── Screens List
        │   └── Screen Cards (with delete)
        └── Action Buttons
            ├── Button: Back
            └── Button: Complete Registration
```

---

## 📈 Next Steps

After integration, you can:

1. **Create Manager Dashboard**
   - View all theatres managed
   - Edit theatre details
   - Manage screens
   - View bookings for shows

2. **Integrate with Shows**
   - Link shows to theatre screens
   - Manage show timings
   - Set dynamic pricing

3. **Add Show Management**
   - Create shows from theatre manager panel
   - Assign movies to screens
   - Set show times and prices

4. **Analytics**
   - Theatre occupancy rates
   - Revenue tracking
   - Customer insights

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Check Network tab for API responses
3. Verify MongoDB collections exist
4. Check server logs for backend errors
5. Test API endpoints with Postman first

---

**Status:** ✅ Ready to Test and Deploy  
**Last Updated:** January 16, 2024  
**Version:** 1.0
