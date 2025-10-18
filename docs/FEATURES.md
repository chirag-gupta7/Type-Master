# TypeMaster - Feature Implementation Guide

## 🎯 What We've Built

A complete typing speed test application with real-time metrics, user analytics, and theme support.

---

## 📱 Pages Overview

### 1. Home Page (`/`)

**URL**: `http://localhost:3000/`

**Features**:

- Duration selector (30s / 1 min / 3 min)
- Real-time WPM counter
- Real-time accuracy percentage
- Color-coded text:
  - ✅ Green = Correct character
  - ❌ Red = Incorrect character
  - ⚪ Gray = Untyped character
- Blinking cursor on current character
- Countdown timer
- Auto-save results when finished
- Reset button to start over

**How to Use**:

1. Select test duration (30s, 1min, or 3min)
2. Click "Start Test" button
3. Begin typing the displayed text
4. Watch WPM and accuracy update in real-time
5. Test auto-ends when timer reaches 0
6. Results are saved automatically

---

### 2. Dashboard Page (`/dashboard`)

**URL**: `http://localhost:3000/dashboard`

**Features**:

- 📊 **4 Metric Cards**:
  - Average WPM
  - Best WPM
  - Total Tests
  - Average Accuracy

- 📈 **Progress Chart**:
  - Blue line: WPM trend over last 10 tests
  - Green line: Accuracy trend over last 10 tests
  - Dual Y-axis (WPM left, Accuracy right)
  - Hover tooltips with exact values

**Data Source**: `/api/v1/tests/stats` and `/api/v1/tests?page=1&limit=10`

---

### 3. History Page (`/history`)

**URL**: `http://localhost:3000/history`

**Features**:

- 📋 **Test Results Table**:
  - Date & Time (formatted)
  - WPM (highlighted in primary color)
  - Accuracy (color-coded: green ≥95%, yellow ≥90%)
  - Duration (formatted: 30s, 1m, 3m)

- 🔄 **Pagination**:
  - 10 tests per page
  - Previous/Next buttons
  - Page counter (e.g., "Page 1 of 5")

**Data Source**: `/api/v1/tests?page={page}&limit=10`

---

### 4. Settings Page (`/settings`)

**URL**: `http://localhost:3000/settings`

**Features**:

- 👤 **Profile Section**:
  - Username update form
  - Success/error message display
  - Save button (shows "Updating..." while loading)

- 🎨 **Appearance Section**:
  - Theme toggle buttons:
    - ☀️ Light
    - 🌙 Dark
    - 💻 System (follows OS preference)
  - Active theme highlighted with primary color

---

## 🧭 Navigation

### Navbar (Visible on all pages)

- **Logo**: "TypeMaster" (clickable, goes to home)
- **Navigation Links**:
  - Home → `/`
  - Dashboard → `/dashboard`
  - History → `/history`
  - Settings → `/settings`
- **Active Route**: Highlighted with primary background color
- **Theme Toggle**: Sun/Moon icon button (right side)

---

## 🎨 Theme System

### Light Mode

- Background: White (#FFFFFF)
- Text: Dark gray (#111827)
- Primary: Blue (#3B82F6)
- Chart colors: Blue + Green

### Dark Mode

- Background: Very dark gray (#0A0A0A)
- Text: Light gray (#F3F4F6)
- Primary: Lighter blue (#60A5FA)
- Chart colors: Light blue + Light green

### System Mode

- Automatically switches based on OS preference
- Respects `prefers-color-scheme` media query

---

## 🔧 Technical Implementation

### State Management (Zustand)

```typescript
// apps/frontend/src/store/index.ts
{
  status: 'idle' | 'active' | 'finished',
  text: string,
  userInput: string,
  errors: number,
  wpm: number,
  accuracy: number,
  startTime: number | null,
  endTime: number | null,
  duration: 30 | 60 | 180
}
```

### API Client

```typescript
// apps/frontend/src/lib/api.ts
- authAPI: { login, register, logout, isAuthenticated }
- testAPI: { saveTestResult, getUserStats, getTestHistory }
- userAPI: { getProfile, updateUserProfile }
```

### Data Visualization

- **Library**: Recharts
- **Chart Type**: LineChart with dual Y-axis
- **Responsive**: Auto-adjusts to container width
- **Theme-aware**: Colors change with theme

---

## 🚀 Running the Application

### Development Mode

**Option 1: Start Both Servers**

```bash
# From project root
npm run dev
```

**Option 2: Start Individually**

```bash
# Terminal 1 - Frontend
cd apps/frontend
npm run dev

# Terminal 2 - Backend
cd apps/backend
npm run dev
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs (if configured)

---

## ✅ Testing Checklist

### Home Page (`/`)

- [ ] Duration buttons clickable and update selection
- [ ] "Start Test" button initializes test
- [ ] Typing updates input and color-codes characters
- [ ] WPM updates in real-time
- [ ] Accuracy updates in real-time
- [ ] Timer counts down correctly
- [ ] Test ends when timer reaches 0
- [ ] Results save to backend

### Dashboard (`/dashboard`)

- [ ] Stats cards display correct metrics
- [ ] Chart renders with data points
- [ ] WPM line shows in blue
- [ ] Accuracy line shows in green
- [ ] Tooltips display on hover
- [ ] Empty state shows when no tests

### History (`/history`)

- [ ] Table displays test results
- [ ] Pagination works (Next/Previous)
- [ ] Date formats correctly
- [ ] Accuracy color-codes (green/yellow)
- [ ] Duration formats correctly

### Settings (`/settings`)

- [ ] Username loads from profile
- [ ] Username update saves successfully
- [ ] Success message displays on save
- [ ] Light theme button works
- [ ] Dark theme button works
- [ ] System theme button works

### Navigation

- [ ] All nav links navigate correctly
- [ ] Active route highlights
- [ ] Theme toggle switches themes
- [ ] Logo navigates to home
- [ ] Navbar visible on all pages

---

## 🐛 Common Issues & Solutions

### Issue: Chart not displaying

**Solution**: Ensure recharts is installed:

```bash
cd apps/frontend
npm install recharts
```

### Issue: Theme toggle not working

**Solution**: Check that `next-themes` is configured in providers:

```typescript
// apps/frontend/src/components/providers.tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

### Issue: API calls failing

**Solution**:

1. Check backend is running on port 5000
2. Verify `NEXT_PUBLIC_API_URL` in `.env`
3. Check browser console for CORS errors

### Issue: Hydration errors

**Solution**: Theme components use `mounted` state to prevent hydration mismatch:

```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

---

## 📊 WPM Calculation Formula

```typescript
// Implemented in: apps/frontend/src/store/index.ts
const calculateWPM = (input: string, timeElapsed: number, errors: number): number => {
  const totalCharsTyped = input.length;
  const timeInMinutes = timeElapsed / 60000; // Convert ms to minutes

  if (timeInMinutes === 0) return 0;

  // Standard WPM: (total chars / 5 - uncorrected errors) / time in minutes
  const grossWPM = totalCharsTyped / 5;
  const netWPM = (grossWPM - errors) / timeInMinutes;

  return Math.max(0, Math.round(netWPM));
};
```

---

## 📦 Files Created

1. **Dashboard**: `apps/frontend/src/app/dashboard/page.tsx`
2. **History**: `apps/frontend/src/app/history/page.tsx`
3. **Settings**: `apps/frontend/src/app/settings/page.tsx`
4. **Navbar**: `apps/frontend/src/components/Navbar.tsx`
5. **Updated Layout**: `apps/frontend/src/app/layout.tsx`
6. **Updated CSS**: `apps/frontend/src/app/globals.css` (chart colors)

---

## 🎉 Implementation Complete!

All 4 parts successfully implemented:

- ✅ Part 1: State Management & API Client
- ✅ Part 2: Core Typing Test Interface
- ✅ Part 3: User-Facing Pages (Dashboard, History, Settings)
- ✅ Part 4: Navigation (Navbar & Layout)

**Ready for**: Development testing, authentication implementation, and deployment!
