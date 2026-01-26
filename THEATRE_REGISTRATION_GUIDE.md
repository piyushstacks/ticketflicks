# 🎭 Theatre Registration System - Documentation

## Overview

The Theatre Registration System allows theatre managers to register their cinemas on the TicketFlicks platform. This feature includes a complete workflow for adding theatre details and screens with seat layouts.

---

## 📋 Database Schemas

### 1. Theatre Collection Schema

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["name", "location", "manager_id", "screens"],
    "properties": {
      "_id": { "bsonType": "objectId" },
      "name": {
        "bsonType": "string",
        "description": "Name of the theatre"
      },
      "location": {
        "bsonType": "string",
        "description": "Location/City of the theatre"
      },
      "manager_id": {
        "bsonType": "objectId",
        "description": "Reference to User (manager)"
      },
      "contact_no": {
        "bsonType": "string",
        "description": "Contact number of the theatre"
      },
      "screens": {
        "bsonType": "array",
        "items": {
          "bsonType": "object",
          "required": ["screen_id", "name", "capacity", "seat_layout"],
          "properties": {
            "screen_id": {
              "bsonType": "objectId",
              "description": "Unique screen identifier"
            },
            "name": {
              "bsonType": "string",
              "description": "Screen name (e.g., 'Screen A', 'IMAX')"
            },
            "capacity": {
              "bsonType": "int",
              "description": "Total seating capacity"
            },
            "seat_layout": {
              "bsonType": "array",
              "description": "2D array of seat numbers",
              "items": {
                "bsonType": "array",
                "items": { "bsonType": "string" }
              }
            }
          }
        }
      },
      "createdAt": { "bsonType": "date" },
      "updatedAt": { "bsonType": "date" }
    }
  }
}
```

**Example Theatre Document:**

```json
{
  "_id": ObjectId("653e12f12caa1eccfa992222"),
  "name": "PVR Cinemas",
  "location": "Bandra, Mumbai",
  "manager_id": ObjectId("653e12f12caa1eccfa991000"),
  "contact_no": "+91-9876543210",
  "screens": [
    {
      "screen_id": ObjectId("653e12f12caa1eccfa993333"),
      "name": "Screen A",
      "capacity": 240,
      "seat_layout": [
        ["A1", "A2", "A3", "A4", "A5"],
        ["B1", "B2", "B3", "B4", "B5"],
        ["C1", "C2", "C3", "C4", "C5"]
      ]
    }
  ],
  "createdAt": ISODate("2024-01-16T10:00:00.000Z"),
  "updatedAt": ISODate("2024-01-16T10:00:00.000Z")
}
```

### 2. Updated User Schema

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["name", "email", "password_hash", "role"],
    "properties": {
      "name": { "bsonType": "string" },
      "email": { "bsonType": "string" },
      "phone": { "bsonType": "string" },
      "password_hash": { "bsonType": "string" },
      "role": {
        "bsonType": "string",
        "enum": ["customer", "manager", "admin"]
      },
      "created_at": { "bsonType": "date" },
      "last_login": { "bsonType": "date" },
      "favorites": { "bsonType": "array", "items": { "bsonType": "string" } }
    }
  }
}
```

---

## 🔌 API Endpoints

### Public Endpoints

#### 1. GET /api/theatre/
**Fetch all theatres**

```bash
curl -X GET http://localhost:3000/api/theatre/
```

**Response:**

```json
{
  "success": true,
  "theatres": [
    {
      "_id": "653e12f12caa1eccfa992222",
      "name": "PVR Cinemas",
      "location": "Bandra, Mumbai",
      "manager_id": {
        "_id": "653e12f12caa1eccfa991000",
        "name": "John Manager",
        "email": "john@example.com",
        "phone": "+91-9876543210"
      },
      "contact_no": "+91-9876543210",
      "screens": [
        {
          "name": "Screen A",
          "capacity": 240,
          "seat_layout": [["A1", "A2"], ["B1", "B2"]]
        }
      ]
    }
  ]
}
```

---

#### 2. GET /api/theatre/:id
**Fetch single theatre**

```bash
curl -X GET http://localhost:3000/api/theatre/653e12f12caa1eccfa992222
```

**Response:**

```json
{
  "success": true,
  "theatre": {
    "_id": "653e12f12caa1eccfa992222",
    "name": "PVR Cinemas",
    "location": "Bandra, Mumbai",
    "manager_id": {...},
    "contact_no": "+91-9876543210",
    "screens": [...]
  }
}
```

---

### Protected Endpoints (Require Authentication)

#### 3. POST /api/theatre/register
**Register a new theatre**

```bash
curl -X POST http://localhost:3000/api/theatre/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "name": "PVR Cinemas",
    "location": "Bandra, Mumbai",
    "contact_no": "+91-9876543210",
    "manager_id": "653e12f12caa1eccfa991000",
    "screens": [
      {
        "name": "Screen A",
        "capacity": 240,
        "seat_layout": [
          ["A1", "A2", "A3"],
          ["B1", "B2", "B3"]
        ]
      },
      {
        "name": "Screen B",
        "capacity": 180,
        "seat_layout": [
          ["A1", "A2"],
          ["B1", "B2"]
        ]
      }
    ]
  }'
```

**Request Body:**

```json
{
  "name": "string (required)",
  "location": "string (required)",
  "contact_no": "string (required)",
  "manager_id": "ObjectId (required)",
  "screens": [
    {
      "name": "string (required)",
      "capacity": "number (required)",
      "seat_layout": "array of arrays of strings (required)"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Theatre registered successfully",
  "theatre": {
    "_id": "653e12f12caa1eccfa992222",
    "name": "PVR Cinemas",
    "location": "Bandra, Mumbai",
    "manager_id": "653e12f12caa1eccfa991000",
    "contact_no": "+91-9876543210",
    "screens": [...]
  }
}
```

---

#### 4. PUT /api/theatre/:id
**Update theatre information**

```bash
curl -X PUT http://localhost:3000/api/theatre/653e12f12caa1eccfa992222 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "name": "PVR Cinemas - Updated",
    "contact_no": "+91-9876543211"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Theatre updated successfully",
  "theatre": {...}
}
```

---

#### 5. POST /api/theatre/:id/screen
**Add a new screen to theatre**

```bash
curl -X POST http://localhost:3000/api/theatre/653e12f12caa1eccfa992222/screen \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "name": "Screen C",
    "capacity": 300,
    "seat_layout": [
      ["A1", "A2", "A3"],
      ["B1", "B2", "B3"],
      ["C1", "C2", "C3"]
    ]
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Screen added successfully",
  "theatre": {...}
}
```

---

#### 6. PUT /api/theatre/:id/screen/:screenIndex
**Update a screen**

```bash
curl -X PUT http://localhost:3000/api/theatre/653e12f12caa1eccfa992222/screen/0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "name": "Screen A - Updated",
    "capacity": 250
  }'
```

---

#### 7. DELETE /api/theatre/:id/screen/:screenIndex
**Delete a screen**

```bash
curl -X DELETE http://localhost:3000/api/theatre/653e12f12caa1eccfa992222/screen/0 \
  -H "Authorization: Bearer USER_TOKEN"
```

---

#### 8. GET /api/theatre/manager/:managerId
**Get all theatres managed by a user**

```bash
curl -X GET http://localhost:3000/api/theatre/manager/653e12f12caa1eccfa991000 \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "theatres": [
    {
      "_id": "653e12f12caa1eccfa992222",
      "name": "PVR Cinemas",
      "location": "Bandra, Mumbai",
      "manager_id": {...},
      "screens": [...]
    }
  ]
}
```

---

#### 9. DELETE /api/theatre/:id
**Delete a theatre**

```bash
curl -X DELETE http://localhost:3000/api/theatre/653e12f12caa1eccfa992222 \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Theatre deleted successfully"
}
```

---

## 🎨 Frontend Components

### 1. TheatreRegistration Component
**Location:** `client/src/components/TheatreRegistration.jsx`

**Purpose:** Modal for registering a new theatre

**Features:**
- Step 1: Basic theatre information (name, location, contact)
- Step 2: Screen management (add, view, remove screens)
- Automatic seat layout generation based on rows and seats per row
- Real-time form validation
- Loading states during submission

**Props:**
```jsx
{
  onClose: function // Called when modal is closed
}
```

**Usage in Theatres.jsx:**

```jsx
<TheatreRegistration onClose={() => setShowRegistration(false)} />
```

---

### 2. Updated Theatres Component
**Location:** `client/src/pages/Theatres.jsx`

**Changes:**
- Added "Apply as Theatre" button in header
- Integrated TheatreRegistration component
- Toggle between show/hide registration modal

---

## 📊 Workflow Diagram

```
User navigates to /theatres
        ↓
Clicks "Apply as Theatre" button
        ↓
TheatreRegistration modal opens
        ↓
Step 1: Enter theatre details
  - Theatre name
  - Location
  - Contact number
        ↓
Click "Next: Add Screens"
        ↓
Step 2: Add screens
  - Screen name
  - Screen capacity
  - Number of rows
  - Seats per row
        ↓
Click "Add Screen" button
        ↓
Screen added to list
  (Repeat for multiple screens)
        ↓
Click "Complete Registration"
        ↓
POST /api/theatre/register
        ↓
Theatre created in MongoDB
  User role updated to "manager"
        ↓
Success toast notification
Modal closes
        ↓
Theatre appears in theatres list
```

---

## 🔐 Authentication & Authorization

- All registration and modification endpoints require Bearer token authentication
- User authentication is managed via Clerk
- Manager role is automatically assigned upon theatre registration
- Only authenticated users can register theatres

---

## ✅ Validation Rules

### Theatre Registration:
- ✅ Name: Required, non-empty string
- ✅ Location: Required, non-empty string
- ✅ Contact Number: Required, non-empty string
- ✅ Manager ID: Required, valid MongoDB ObjectId
- ✅ Screens: Required, at least 1 screen must be provided

### Screen Addition:
- ✅ Screen Name: Required, non-empty string
- ✅ Capacity: Required, positive integer
- ✅ Rows: Required, positive integer
- ✅ Seats per Row: Required, positive integer
- ✅ At least one screen required in theatre

---

## 📱 UI/UX Features

### TheatreRegistration Modal:
- Dark-themed interface matching platform design
- Two-step form wizard
- Real-time validation feedback
- Loading states during submission
- Toast notifications for success/error
- Ability to add multiple screens
- Screen preview cards with delete option
- Responsive design for mobile/tablet/desktop

### Button Styling:
- Primary color button in Theatres header
- Icon + text for clarity
- Smooth hover transitions
- Active state feedback

---

## 🐛 Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Missing required fields | 400 | "All required fields must be provided" |
| No screens provided | 400 | "At least one screen must be provided" |
| Theatre not found | 404 | "Theatre not found" |
| Invalid manager ID | 404 | "Manager not found" |
| Database error | 500 | "Error registering theatre" |
| Cannot delete only screen | 400 | "Cannot delete the only screen" |

---

## 🧪 Testing Checklist

- [ ] Register new theatre with basic info
- [ ] Add single screen successfully
- [ ] Add multiple screens
- [ ] Generate correct seat layout
- [ ] Remove added screens
- [ ] Submit registration
- [ ] Theatre appears in list after registration
- [ ] User role updated to "manager"
- [ ] Navigate back without registering
- [ ] Validation errors display correctly
- [ ] Loading state shows during submission
- [ ] Success/error toasts appear
- [ ] Test on mobile/tablet/desktop
- [ ] Verify stored data in MongoDB

---

## 📝 Example Theatre Data

```javascript
// Example: Register PVR Cinema with 2 screens
{
  "name": "PVR Cinemas",
  "location": "Bandra, Mumbai",
  "contact_no": "+91-9876543210",
  "manager_id": "user_object_id_here",
  "screens": [
    {
      "name": "Screen A - Standard",
      "capacity": 240,
      "seat_layout": [
        ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"],
        ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10"],
        // ... 10 rows total
      ]
    },
    {
      "name": "Screen B - Premium",
      "capacity": 180,
      "seat_layout": [
        ["A1", "A2", "A3", "A4", "A5", "A6"],
        ["B1", "B2", "B3", "B4", "B5", "B6"],
        // ... 8 rows total
      ]
    }
  ]
}
```

---

## 🚀 Deployment Checklist

- [ ] Theatre model created in MongoDB
- [ ] theatreController.js implemented with all functions
- [ ] theatreRoutes.js created with all endpoints
- [ ] Routes registered in server.js
- [ ] User model updated with "manager" role
- [ ] TheatreRegistration component created
- [ ] Theatres.jsx updated with button and modal
- [ ] All API endpoints tested with Postman
- [ ] Frontend component tested in browser
- [ ] End-to-end registration flow tested
- [ ] Database validation rules applied
- [ ] Error handling verified
- [ ] Mobile responsiveness tested

---

**Last Updated:** January 16, 2024  
**Status:** ✅ Complete and Ready for Integration  
**Version:** 1.0
