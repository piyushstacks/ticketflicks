# 🎨 Theatre Registration - UI/UX Visual Guide

## Component Hierarchy

```
App
└── Theatres Page (/theatres)
    ├── Header
    │   ├── Title: "Find Your Theater"
    │   └── Button: "Apply as Theatre" ← NEW
    │       └── Icon: Plus
    │       └── Text: "Apply as Theatre"
    │
    ├── Search Section (existing)
    │
    ├── Theatres Grid (existing)
    │
    └── TheatreRegistration Modal ← NEW
        ├── Header
        │   ├── Title: "Register Your Theatre"
        │   └── Close Button (X)
        │
        ├── Step 1 Content (Conditional)
        │   ├── Form Section
        │   │   ├── Input: Theatre Name
        │   │   ├── Input: Location
        │   │   └── Input: Contact Number
        │   │
        │   └── Navigation
        │       └── Button: "Next: Add Screens"
        │
        ├── Step 2 Content (Conditional)
        │   ├── Screen Addition Form
        │   │   ├── Input: Screen Name
        │   │   ├── Input: Total Capacity
        │   │   ├── Input: Number of Rows
        │   │   ├── Input: Seats per Row
        │   │   └── Button: "Add Screen"
        │   │
        │   ├── Screens List
        │   │   └── Screen Cards (Repeat)
        │   │       ├── Info: Screen Name
        │   │       ├── Info: Capacity & Layout
        │   │       └── Button: Delete (Trash Icon)
        │   │
        │   └── Navigation
        │       ├── Button: "Back"
        │       └── Button: "Complete Registration"
        │
        └── Toast Notifications (Success/Error)
```

---

## UI Mockup - Theatres Page

### Before (Original)

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  Find Your Theater                                         ║
║                                                            ║
║  [Search Input: Search theaters...]                        ║
║                                                            ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    ║
║  │ PVR Cinemas  │  │ Inox Cinema  │  │ Cinepolis    │    ║
║  │              │  │              │  │              │    ║
║  │ 📍 Bandra    │  │ 📍 Worli     │  │ 📍 Andheri   │    ║
║  │              │  │              │  │              │    ║
║  │ 3 Screens    │  │ 2 Screens    │  │ 4 Screens    │    ║
║  │              │  │              │  │              │    ║
║  │[View Movies] │  │[View Movies] │  │[View Movies] │    ║
║  └──────────────┘  └──────────────┘  └──────────────┘    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### After (With Registration Button)

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  Find Your Theater          [+ Apply as Theatre]           ║
║                                                            ║
║  [Search Input: Search theaters...]                        ║
║                                                            ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    ║
║  │ PVR Cinemas  │  │ Inox Cinema  │  │ Cinepolis    │    ║
║  │              │  │              │  │              │    ║
║  │ 📍 Bandra    │  │ 📍 Worli     │  │ 📍 Andheri   │    ║
║  │              │  │              │  │              │    ║
║  │ 3 Screens    │  │ 2 Screens    │  │ 4 Screens    │    ║
║  │              │  │              │  │              │    ║
║  │[View Movies] │  │[View Movies] │  │[View Movies] │    ║
║  └──────────────┘  └──────────────┘  └──────────────┘    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## UI Mockup - Registration Modal

### Step 1: Basic Information

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  Register Your Theatre                              [✕]   ║
║  ─────────────────────────────────────────────────────── ║
║                                                            ║
║  Theatre Name *                                            ║
║  ┌────────────────────────────────────────────────────┐   ║
║  │ e.g., PVR Cinemas, Inox, etc.                     │   ║
║  └────────────────────────────────────────────────────┘   ║
║                                                            ║
║  Location *                                                ║
║  ┌────────────────────────────────────────────────────┐   ║
║  │ e.g., Bandra, Downtown, etc.                      │   ║
║  └────────────────────────────────────────────────────┘   ║
║                                                            ║
║  Contact Number *                                          ║
║  ┌────────────────────────────────────────────────────┐   ║
║  │ +91 XXXXX XXXXX                                   │   ║
║  └────────────────────────────────────────────────────┘   ║
║                                                            ║
║                   [Next: Add Screens →]                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### Step 2: Screen Management

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  Register Your Theatre                              [✕]   ║
║  ─────────────────────────────────────────────────────── ║
║                                                            ║
║  ┌──────────────────────────────────────────────────┐     ║
║  │ Add Screen                                       │     ║
║  │                                                  │     ║
║  │ Screen Name *              Total Capacity *     │     ║
║  │ ┌──────────────────┐  ┌──────────────────┐     │     ║
║  │ │ Screen A         │  │ 240              │     │     ║
║  │ └──────────────────┘  └──────────────────┘     │     ║
║  │                                                  │     ║
║  │ Number of Rows *       Seats per Row *         │     ║
║  │ ┌──────────────────┐  ┌──────────────────┐     │     ║
║  │ │ 12               │  │ 20               │     │     ║
║  │ └──────────────────┘  └──────────────────┘     │     ║
║  │                                                  │     ║
║  │       [+ Add Screen]                            │     ║
║  └──────────────────────────────────────────────────┘     ║
║                                                            ║
║  Added Screens (2)                                         ║
║  ┌──────────────────────────────────────────────────┐     ║
║  │ Screen A                                    [🗑] │     ║
║  │ Capacity: 240 | Layout: 12x20                  │     ║
║  └──────────────────────────────────────────────────┘     ║
║  ┌──────────────────────────────────────────────────┐     ║
║  │ Screen B                                    [🗑] │     ║
║  │ Capacity: 180 | Layout: 9x20                   │     ║
║  └──────────────────────────────────────────────────┘     ║
║                                                            ║
║          [← Back]  [Complete Registration ⏳]             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## Button Styling Reference

### "Apply as Theatre" Button

**States:**

1. **Default (Inactive)**
   ```
   Background: Primary color (#FF6B35)
   Text: White
   Icon: Plus sign
   Border: None
   ```

2. **Hover**
   ```
   Background: Primary-dull (slightly darker)
   Text: White
   Cursor: pointer
   Transform: slight scale
   Transition: 200ms smooth
   ```

3. **Active/Clicked**
   ```
   Background: Primary-dull
   Scale: 0.95
   Transition: instant
   ```

### Form Buttons

**"Next" / "Complete Registration" Buttons**
- Background: Primary color
- Text: White
- Padding: Full width (py-3)
- Font: Semi-bold
- Hover: Darker shade
- Active: Scale down 0.95
- Disabled: Opacity 0.5, cursor not-allowed

**"Back" Button**
- Background: Gray-800
- Text: White
- Hover: Gray-700
- Similar sizing to action button

**"Add Screen" Button**
- Background: Primary/20 (light primary)
- Text: Primary color
- Border: Primary/50
- Icon: Plus sign

---

## Color Scheme

```
Primary Colors:
- Primary: #FF6B35 (Main action color)
- Primary-dull: #E55A24 (Hover/dark state)
- Primary/20: #FF6B35 with 20% opacity
- Primary/50: #FF6B35 with 50% opacity

Background:
- Gray-900: #111827 (Main dark background)
- Gray-800: #1F2937 (Secondary dark)
- Gray-800/50: Semi-transparent

Borders:
- Gray-700: #374151 (Default border)
- Primary/50: Light primary border for highlights

Text:
- White: #FFFFFF (Main text)
- Gray-400: #9CA3AF (Secondary text)
- Gray-500: #6B7280 (Tertiary text)

Accents:
- Success: #10B981 (Green for success)
- Error: #EF4444 (Red for errors)
- Warning: #F59E0B (Orange for warnings)
```

---

## Responsive Breakpoints

### Mobile (< 640px)
- Modal: Full screen with padding
- Grid inputs: Single column
- Button: Full width
- Font: Reduced size

### Tablet (640px - 1024px)
- Modal: 90% width
- Grid inputs: 2 columns
- Button: Full width
- Font: Medium size

### Desktop (> 1024px)
- Modal: 800px max-width
- Grid inputs: 2-4 columns as needed
- Button: Auto width with padding
- Font: Full size

---

## Form Validation States

### Input Field States

**1. Default**
```
Border: Gray-700
Background: Gray-800
Text: White
```

**2. Focus**
```
Border: Primary color
Background: Gray-800 (unchanged)
Outline: None
Box-shadow: Subtle glow
```

**3. Error**
```
Border: Red/500
Background: Red/10
Text: White with error message below
Icon: Error indicator
Message color: Red-400
```

**4. Valid (Optional)**
```
Border: Green/500
Background: Green/10
Icon: Checkmark
```

---

## Animation & Transitions

### Modal Appearance
```
Fade in: 200ms opacity transition
Scale: 100% (no scale animation)
Backdrop: 50% opacity blur
```

### Form Step Transitions
```
When moving between steps:
- Current step fades out: 150ms
- New step fades in: 150ms
- No scroll animation
```

### Button Interactions
```
Hover: 200ms smooth color transition
Active: Instant scale to 0.95
Loading: Spinner animation 1s loop
```

### Toast Notifications
```
Slide in from bottom: 300ms
Display: 3-4 seconds
Fade out: 300ms
```

---

## Accessibility Features

✅ **Semantic HTML**
- Proper form labels
- Input type attributes
- Button role attributes

✅ **Keyboard Navigation**
- Tab through all inputs
- Enter to submit forms
- Escape to close modal
- Tab-focus visible indicators

✅ **Screen Readers**
- Descriptive labels
- Error message associations
- Loading state announcements
- Success confirmations

✅ **Color Contrast**
- WCAG AA compliant
- Text-to-background contrast ≥ 4.5:1

---

## User Interactions

### Mouse Events
```
Click: "Apply as Theatre" → Modal opens
Click: Input field → Focus state
Click: "Add Screen" → Screen added to list
Click: Trash icon → Screen removed
Click: "Next" → Progress to step 2
Click: "Back" → Return to step 1
Click: "Complete Registration" → Submit form
Click: X button → Close modal
Click: Outside modal → Close modal (optional)
```

### Keyboard Events
```
Tab: Navigate between inputs
Shift+Tab: Reverse navigation
Enter: Submit button
Escape: Close modal
```

### Touch Events (Mobile)
```
Tap: Same as click
Swipe: Scroll within modal
Long press: No special behavior
```

---

## Error Handling UI

### Validation Errors

**Empty Field**
```
Border: Red
Message: "Field name is required"
Icon: Warning icon
Position: Below input
Color: Red-400
```

**Invalid Format**
```
Border: Red
Message: "Please enter valid format"
Icon: X icon
Position: Below input
Color: Red-400
```

**API Error**
```
Type: Toast notification (center)
Message: Error description from server
Duration: 4 seconds
Action: Close button
Color: Red theme
```

### Success Notification

```
Type: Toast notification (bottom-right)
Message: "Theatre registered successfully!"
Icon: Checkmark
Duration: 3 seconds
Color: Green theme
Auto-close: Yes
```

---

## Loading States

### Form Submission Loading

```
Button Text: "Registering..." (changes)
Button Icon: Spinner animation (added)
Button Disabled: Yes
Input Fields: Disabled
Other Buttons: Disabled
Modal: Cannot close (unless forced)
```

### API Loading

```
Show: Spinner or progress indicator
Message: "Loading theatres..."
Position: Center of available space
Opacity: Reduced background
User can: Not interact with content
```

---

## Performance Considerations

✅ **Optimizations**
- Debounce form inputs: 300ms
- Memoize component lists
- Lazy load modal content
- Cache API responses
- Minimize re-renders

✅ **Smooth Animations**
- Use CSS transitions (GPU-accelerated)
- Avoid heavy JavaScript animations
- Keep frame rate 60fps
- Test on slower devices

---

## Browser Compatibility

✅ **Supported Browsers**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome)

✅ **Features**
- CSS Grid & Flexbox
- CSS Variables
- ES6+ JavaScript
- Modern React Hooks
- Async/Await

---

## Theme Integration

### Dark Theme (Current)

```
Primary: Warm orange (#FF6B35)
Background: Dark gray/black
Text: Light gray/white
Accents: Orange highlights

Mood: Modern, Professional, Tech-savvy
```

### Future Light Theme (if needed)

```
Primary: Orange (same)
Background: Light gray/white
Text: Dark gray/black
Accents: Orange highlights

Mood: Clean, Bright, Approachable
```

---

**UI/UX Guide Version:** 1.0  
**Last Updated:** January 16, 2024  
**Status:** ✅ Complete
