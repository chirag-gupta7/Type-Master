# TypeMaster Testing Guide

## Overview

Comprehensive testing guide for TypeMaster, covering all testing strategies, procedures, and checklists.

**Last Updated:** December 2024  
**Version:** 1.0.0

---

## Table of Contents

1. [Quick Testing (5-15 minutes)](#quick-testing)
2. [Essential Tests](#essential-tests)
3. [Complete Test Suite](#complete-test-suite)
4. [Bug Verification](#bug-verification)
5. [Commands Reference](#commands-reference)

---

## Quick Testing

### 5-Minute Quick Test

Perfect for rapid verification of core functionality.

#### Prerequisites

```powershell
# Terminal 1: Start Backend
cd apps/backend
npm run dev

# Terminal 2: Start Frontend
cd apps/frontend
npm run dev

# Terminal 3: Seed Database
cd apps/backend
npm run prisma:seed
```

#### Core Tests (5 min)

**✅ Test 1: Database Seed (30 sec)**

```powershell
cd apps/backend
npm run prisma:seed
```

**Expected Result:**

- ✅ 14 lessons created
- ✅ 14 achievements created
- ✅ No errors

**✅ Test 2: API Endpoint (30 sec)**

```
Visit: http://localhost:5000/api/v1/lessons
```

**Expected Result:**

- ✅ JSON array with 14 lessons
- ✅ Status 200
- ✅ All lesson data present

**✅ Test 3: Learn Page (1 min)**

```
Visit: http://localhost:3000/learn
```

**Expected Result:**

- ✅ 14 lessons displayed
- ✅ Grouped by 4 levels
- ✅ Cards clickable
- ✅ No console errors

**✅ Test 4: Lesson Practice (2 min)**

```
1. Click any lesson card
2. Click "Start Lesson"
3. Type some text
```

**Expected Result:**

- ✅ Visual keyboard displays
- ✅ Yellow highlights next key
- ✅ Green flash on correct press
- ✅ Red flash on incorrect press
- ✅ Text colors update correctly
- ✅ WPM/accuracy calculate in real-time

**✅ Test 5: Progress Dashboard (1 min)**

```
Visit: http://localhost:3000/progress
```

**Expected Result:**

- ✅ 4 visualizations render
- ✅ Charts display data (if lessons completed)
- ✅ No errors
- ✅ Responsive layout

---

### 15-Minute Essential Tests

More thorough testing of critical features.

#### Database Tests (3 min)

**1. Migration**

```powershell
cd apps/backend
npm run prisma:migrate
```

✅ **Pass if:** No errors, all tables created

**2. Seed Data**

```powershell
npm run prisma:seed
```

✅ **Pass if:** 14 lessons + 14 achievements

**3. Verify Data**

```powershell
npm run prisma:studio
# Opens at http://localhost:5555
```

✅ **Pass if:**

- All tables visible
- Data populated
- Relationships working

#### Backend API Tests (4 min)

**1. Get All Lessons**

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/lessons" | ConvertFrom-Json
```

✅ **Pass if:** Returns 14 lessons, status 200

**2. Get Single Lesson**

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/lessons/1" | ConvertFrom-Json
```

✅ **Pass if:** Returns lesson 1 with content

**3. Register User**

```powershell
$body = @{
    email = "test@example.com"
    password = "Test123456!"
    username = "testuser"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/v1/auth/register" -Method POST -Body $body -ContentType "application/json" | ConvertFrom-Json
```

✅ **Pass if:** User created, returns token

**4. Login**

```powershell
$body = @{
    email = "test@example.com"
    password = "Test123456!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json" | ConvertFrom-Json
$token = $response.token
```

✅ **Pass if:** Login successful, token received

**5. Save Progress (with auth)**

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    lessonId = 1
    wpm = 45
    accuracy = 92
    timeSpent = 120
    completed = $true
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/v1/lessons/progress" -Method POST -Body $body -Headers $headers | ConvertFrom-Json
```

✅ **Pass if:** Progress saved, stars calculated

#### Frontend Tests (8 min)

**1. Lesson List Page**

```
http://localhost:3000/learn
```

Test:

- [ ] Page loads without errors
- [ ] 14 lessons display
- [ ] 4 level groups visible
- [ ] Cards have titles and descriptions
- [ ] Can click cards to navigate
- [ ] Loading states work
- [ ] Responsive design

**2. Lesson Practice Page**

```
http://localhost:3000/learn/1
```

Test:

- [ ] Lesson content loads
- [ ] Can start lesson
- [ ] Text displays correctly
- [ ] Input field works
- [ ] Visual keyboard shows
- [ ] Metrics display (WPM, Accuracy)

**3. Visual Keyboard**

Test:

- [ ] All keys visible
- [ ] Next key highlighted (yellow)
- [ ] Correct press = green flash (200ms)
- [ ] Wrong press = red flash (200ms)
- [ ] F & J markers visible
- [ ] Home row identifiable
- [ ] Animations smooth (60fps)

**4. Typing Mechanics**

Test:

- [ ] Can type entire lesson text
- [ ] Characters turn green (correct)
- [ ] Characters turn red (incorrect)
- [ ] WPM updates in real-time
- [ ] Accuracy updates in real-time
- [ ] Cursor moves correctly
- [ ] Spaces handled properly

**5. Completion & Stars**

Test:

- [ ] Complete lesson successfully
- [ ] Stars awarded (0-3)
- [ ] Results screen displays
- [ ] Progress saves to database
- [ ] Can view updated stats
- [ ] Next lesson suggested

**6. Progress Dashboard**

```
http://localhost:3000/progress
```

Test:

- [ ] Circular progress chart loads
- [ ] WPM progress chart loads
- [ ] Heat map calendar loads
- [ ] Skill tree visualization loads
- [ ] Data displays correctly
- [ ] Charts interactive
- [ ] No errors

---

## Essential Tests

### Critical Path Test (10 min)

Complete user flow from start to finish.

#### Step-by-Step Flow

**1. Start Application**

```
Visit: http://localhost:3000
```

✅ Homepage loads with hero section

**2. Navigate to Learn**

```
Click "Learn" in navbar or visit /learn
```

✅ See all lessons in grid layout

**3. Start First Lesson**

```
Click Lesson 1: "Home Row: F and J"
```

✅ Lesson page loads with content

**4. Begin Typing**

```
Click "Start Lesson"
Type: "fff jjj ddd kkk sss lll aaa ;;;"
```

✅ Expectations:

- Keyboard highlights work
- Text feedback correct
- Stats calculate (WPM, Accuracy)
- No lag or errors

**5. Complete Lesson**

```
Type all lesson text correctly
```

✅ Expectations:

- Results screen shows
- Stars awarded (0-3)
- Progress saves automatically
- Next lesson option appears

**6. Verify Progress**

```
Navigate back to /learn
```

✅ Expectations:

- Lesson 1 shows as completed
- Stars display on card
- Progress percentage updated

**7. Check Dashboard**

```
Navigate to /progress
```

✅ Expectations:

- Charts show new data
- Completion stats updated
- Heat map shows activity
- Skill tree reflects progress

**8. View History** (if implemented)

```
Navigate to /history
```

✅ Expectations:

- Test results listed
- Can filter/sort
- Statistics accurate

**🎯 If all steps pass: CRITICAL PATH WORKING ✅**

---

## Complete Test Suite

### Test Scenarios

#### Scenario 1: Perfect Accuracy (3 Stars)

```
1. Start Lesson 1
2. Type EXACTLY correctly (no mistakes)
3. Finish lesson
```

**Expected Result:**

- Accuracy: 100%
- Stars: ⭐⭐⭐ (3/3)
- WPM: Varies based on speed
- Green congratulations message

#### Scenario 2: Good Accuracy (2 Stars)

```
1. Start Lesson 2
2. Make 2-3 intentional mistakes
3. Finish lesson
```

**Expected Result:**

- Accuracy: 70-89%
- Stars: ⭐⭐☆ (2/3)
- WPM: Calculated correctly
- Encouragement message

#### Scenario 3: Low Accuracy (1 Star)

```
1. Start Lesson 3
2. Make many mistakes (10+)
3. Finish lesson
```

**Expected Result:**

- Accuracy: 50-69%
- Stars: ⭐☆☆ (1/3)
- Suggestions for improvement

#### Scenario 4: Very Low Accuracy (0 Stars)

```
1. Start Lesson 4
2. Make lots of mistakes (20+)
3. Finish lesson
```

**Expected Result:**

- Accuracy: <50%
- Stars: ☆☆☆ (0/3)
- Retry recommendation

#### Scenario 5: Speed Test (High WPM)

```
1. Start any lesson
2. Type as fast as possible while maintaining accuracy
3. Complete lesson
```

**Expected Result:**

- High WPM (60+)
- Achievement unlock possible ("Speed Demon")
- Leaderboard update (if implemented)

#### Scenario 6: Streak Building

```
1. Complete lesson on Day 1
2. Come back and complete lesson on Day 2
3. Repeat for 7 consecutive days
```

**Expected Result:**

- Day 7: "Week Warrior" achievement unlocks
- Heat map shows 7-day streak
- Current streak counter = 7

### Performance Tests

#### Load Time Testing

**Metrics to Track:**

| Page               | Target Load Time | Acceptable |
| ------------------ | ---------------- | ---------- |
| Homepage           | < 1s             | < 2s       |
| Learn Page         | < 1.5s           | < 3s       |
| Lesson Page        | < 1s             | < 2s       |
| Progress Dashboard | < 2s             | < 4s       |

**Testing:**

```javascript
// Use browser DevTools Performance tab
performance.mark('pageStart');
// ... page loads
performance.mark('pageEnd');
performance.measure('pageLoad', 'pageStart', 'pageEnd');
console.log(performance.getEntriesByName('pageLoad'));
```

#### Animation Performance

**Target:** 60fps for all animations

**Test:**

1. Open DevTools > Performance
2. Start recording
3. Trigger animations (keyboard press, chart load)
4. Stop recording
5. Check FPS graph

✅ **Pass if:** No drops below 50fps

#### Memory Usage

**Test:**

1. Open DevTools > Memory
2. Take heap snapshot
3. Complete several lessons
4. Take another snapshot
5. Compare memory usage

✅ **Pass if:** No significant memory leaks

---

## Bug Verification

### Fixed Bugs Testing

Verify that previously fixed bugs remain resolved.

#### Bug #1: Input Tracking

**Original Issue:** Tracking failed after first word

**Test Steps:**

1. Start any lesson
2. Type first word + space
3. Continue typing second word
4. Type several more words

**Verification:**

- [ ] All words track correctly
- [ ] Spaces don't break tracking
- [ ] No blank input issues
- [ ] State remains consistent

✅ **Status:** Should be FIXED

#### Bug #2: WPM and Accuracy Counters

**Original Issue:** Counters not updating

**Test Steps:**

1. Start typing test
2. Type at varying speeds
3. Make intentional mistakes
4. Watch counters

**Verification:**

- [ ] WPM updates in real-time
- [ ] Accuracy updates on each keystroke
- [ ] Formula correct: `(chars/5 - errors) / minutes`
- [ ] Accuracy formula: `(correct/total) * 100`
- [ ] Values make logical sense

✅ **Status:** Should be FIXED

#### Bug #3: Cursor Position

**Original Issue:** Cursor after first character instead of before

**Test Steps:**

1. Start lesson
2. Observe cursor position at start of each word
3. Type characters and watch cursor move

**Verification:**

- [ ] Cursor appears BEFORE first character
- [ ] Cursor moves correctly between characters
- [ ] No offset issues
- [ ] Consistent across all words

✅ **Status:** Should be FIXED

---

## Commands Reference

### Development Commands

```powershell
# Backend
cd apps/backend
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run test             # Run tests
npm run prisma:studio    # Open database GUI

# Frontend
cd apps/frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run test             # Run tests
npm run lint             # Lint code

# Database
cd apps/backend
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:reset     # Reset database (⚠️ DESTRUCTIVE)
```

### Testing Commands (PowerShell)

**Health Check:**

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/health" | ConvertFrom-Json
```

**Get Lessons:**

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/lessons" | ConvertFrom-Json
```

**Register User:**

```powershell
$body = @{email="test@example.com";password="Test123456!";username="testuser"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/auth/register" -Method POST -Body $body -ContentType "application/json"
```

**Login:**

```powershell
$body = @{email="test@example.com";password="Test123456!"} | ConvertTo-Json
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json" | ConvertFrom-Json
$token = $response.token
```

### URLs Reference

```
Backend API:       http://localhost:5000
Frontend App:      http://localhost:3000
Prisma Studio:     http://localhost:5555

API Endpoints:
- /api/v1/auth/register
- /api/v1/auth/login
- /api/v1/lessons
- /api/v1/lessons/:id
- /api/v1/lessons/progress
- /api/v1/lessons/progress/stats
- /api/v1/lessons/progress/visualization
- /api/v1/achievements
- /api/v1/tests

Frontend Pages:
- /                    (Home)
- /learn               (Lesson List)
- /learn/[id]          (Lesson Practice)
- /progress            (Dashboard)
- /test                (Typing Test)
- /history             (Test History)
- /keyboard-demo       (Demo)
```

---

## Common Issues & Fixes

### Issue: Seed Fails

**Error:** `P2002: Unique constraint failed`

**Fix:**

```powershell
cd apps/backend
npm run prisma:reset  # ⚠️ Deletes all data
npm run prisma:seed
```

### Issue: API Returns Empty Array

**Problem:** `GET /api/v1/lessons` returns `[]`

**Fix:**

```powershell
cd apps/backend
npm run prisma:seed
```

### Issue: Keyboard Not Highlighting

**Possible Causes:**

- Input not focused
- Event listener not attached
- State not updating

**Fix:**

1. Click in typing area
2. Refresh page
3. Check console for errors

### Issue: Progress Not Saving

**Possible Causes:**

- Not authenticated
- API error
- Database connection issue

**Fix:**

1. Verify user is logged in
2. Check backend logs
3. Verify database connection
4. Check Prisma Studio for data

### Issue: Charts Not Loading

**Possible Causes:**

- No data yet
- API endpoint error
- Recharts not installed

**Fix:**

1. Complete some lessons first
2. Check API response in Network tab
3. Verify `npm install` ran successfully
4. Check console for errors

---

## Test Checklist Summary

### Backend Tests (5)

- [ ] ✅ Migration runs successfully
- [ ] ✅ Seed creates correct data (14 lessons, 14 achievements)
- [ ] ✅ GET /api/v1/lessons works
- [ ] ✅ GET /api/v1/lessons/:id works
- [ ] ✅ POST /api/v1/lessons/progress works (with auth)

### Frontend Tests (8)

- [ ] ✅ Learn page displays all lessons
- [ ] ✅ Lesson page loads correctly
- [ ] ✅ Visual keyboard displays
- [ ] ✅ Keyboard highlighting works
- [ ] ✅ Typing updates text colors
- [ ] ✅ WPM calculates correctly
- [ ] ✅ Stars awarded based on accuracy
- [ ] ✅ Progress saves to database

### Dashboard Tests (4)

- [ ] ✅ Progress page loads
- [ ] ✅ Circular chart displays
- [ ] ✅ WPM chart displays
- [ ] ✅ Heat map displays
- [ ] ✅ Skill tree displays

### Bug Verification (3)

- [ ] ✅ Input tracking works across multiple words
- [ ] ✅ WPM and accuracy update in real-time
- [ ] ✅ Cursor positioned correctly

**Total: 20 Essential Tests**

**Target Pass Rate:** 100% (20/20)

---

## Testing Priority

### P0 - Critical (Must Work)

1. Database seed
2. Lesson list displays
3. Can type in lessons
4. Visual keyboard shows
5. Progress saves

**If P0 fails:** Block deployment

### P1 - High Priority (Should Work)

1. WPM/accuracy calculate
2. Stars awarded correctly
3. Dashboard displays
4. Charts load with data
5. Authentication works

**If P1 fails:** Investigate before deployment

### P2 - Medium Priority (Nice to Have)

1. Animations smooth
2. Dark mode works
3. Responsive design
4. Error handling graceful

**If P2 fails:** Note for future fix

---

## Sign-Off

### Minimum Viable Product (MVP)

Complete these 5 tests to verify core functionality:

- [ ] ✅ Seed creates 14 lessons
- [ ] ✅ Lessons display on /learn
- [ ] ✅ Can type in lesson
- [ ] ✅ Keyboard highlights work
- [ ] ✅ Progress saves

**If all 5 pass:** Core functionality working ✅

### Production Ready

Complete all 20 essential tests

**If all 20 pass:** Ready for production ✅

---

## Testing Schedule

**Daily Testing:**

- Quick 5-minute test
- Verify critical path
- Check for regressions

**Weekly Testing:**

- Full essential tests (15 min)
- Performance testing
- Cross-browser testing

**Pre-Deployment:**

- Complete test suite
- All scenarios
- Performance benchmarks
- Security audit

---

## Conclusion

This comprehensive testing guide ensures TypeMaster maintains high quality and reliability. Follow the quick tests for daily verification and the complete suite before major releases.

**Testing Coverage:** ✅ Complete  
**Documentation Status:** ✅ Production Ready

---

**Document Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** ✅ Complete
