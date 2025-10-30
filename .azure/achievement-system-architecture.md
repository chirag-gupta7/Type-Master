# 🏗️ TypeMaster Achievement System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Lesson Practice Page (/learn/[id])            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  1. User Types → Calculate WPM, Accuracy, Stars      │ │  │
│  │  │  2. Click "Save Progress"                            │ │  │
│  │  │  3. handleSaveProgress() {                           │ │  │
│  │  │       await checkAchievements(results, userStats)    │ │  │
│  │  │     }                                                 │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         useAchievementChecker Hook (Logic Layer)          │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  • Check speed achievements (100/120/150 WPM)        │ │  │
│  │  │  • Check accuracy achievements (98/99/100%)          │ │  │
│  │  │  • Check star achievements (3 stars)                 │ │  │
│  │  │  • Check milestones (10/25/50/100 lessons)           │ │  │
│  │  │  • Return array of eligible achievements             │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        AchievementContext (Global State Manager)          │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  State:                                               │ │  │
│  │  │  • currentAchievement                                 │ │  │
│  │  │  • showModal (boolean)                                │ │  │
│  │  │  • toastAchievement                                   │ │  │
│  │  │  • currentMilestone                                   │ │  │
│  │  │  • showMilestoneModal (boolean)                       │ │  │
│  │  │                                                        │ │  │
│  │  │  Methods:                                              │ │  │
│  │  │  • showAchievement(achievement, withModal)            │ │  │
│  │  │  • showMilestone(milestone)                           │ │  │
│  │  │  • clearNotifications()                               │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌─────────────────────┬────────────────────┬─────────────────┐ │
│  │                     │                    │                 │ │
│  │  AchievementUnlock  │  AchievementToast  │   Milestone     │ │
│  │      Modal          │    Notification    │  Celebration    │ │
│  │  ┌───────────────┐  │  ┌──────────────┐ │  ┌────────────┐ │ │
│  │  │ • Full-screen │  │  │ • Top-right  │ │  │ • Full-page│ │ │
│  │  │ • Confetti    │  │  │ • Stackable  │ │  │ • Particles│ │ │
│  │  │ • Spring anim │  │  │ • Auto-dismiss│ │  │ • Stats    │ │ │
│  │  │ • Category    │  │  │ • Progress bar│ │  │ • Quote    │ │ │
│  │  │   colors      │  │  │ • Icon       │ │  │ • Count    │ │ │
│  │  │ • Points      │  │  │              │ │  │            │ │ │
│  │  └───────────────┘  │  └──────────────┘ │  └────────────┘ │ │
│  └─────────────────────┴────────────────────┴─────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Achievement Detection Flow

```
Lesson Complete
       │
       ↓
┌──────────────────┐
│ Calculate Results │
│  • WPM            │
│  • Accuracy       │
│  • Stars (0-3)    │
│  • Completed (✓/✗)│
└──────────────────┘
       │
       ↓
┌─────────────────────────────┐
│ checkAchievements()          │
│  Input:                      │
│   - lessonResult             │
│   - userStats                │
│                              │
│ Logic:                       │
│  1. Check speed thresholds   │
│  2. Check accuracy thresholds│
│  3. Check stars earned       │
│  4. Check lesson complete    │
│  5. Check milestones         │
└─────────────────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Achievements Detected?    │
└──────────────────────────┘
       │
       ├─── NO ──→ Continue to results
       │
       ↓ YES
┌─────────────────────────────────┐
│ Display Logic:                   │
│                                  │
│ IF count === 1:                  │
│   → Show as modal + confetti     │
│                                  │
│ IF count > 1:                    │
│   → First as modal + confetti    │
│   → Rest as toasts (staggered)   │
│                                  │
│ IF milestone reached:            │
│   → Show after achievements      │
└─────────────────────────────────┘
       │
       ↓
┌─────────────────────┐
│ Update User Stats    │
│  • lessonsCompleted++│
│  • sectionsCompleted │
└─────────────────────┘
       │
       ↓
   Continue to
 Results/Analysis
```

---

## Component Communication

```
┌─────────────────────────────────────────────────────────────┐
│                         App Layout                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               AchievementProvider                     │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │              All Page Components                │  │   │
│  │  │  ┌──────────────────────────────────────────┐  │  │   │
│  │  │  │        Any component can call:           │  │  │   │
│  │  │  │  const { showAchievement } =             │  │  │   │
│  │  │  │         useAchievements()                │  │  │   │
│  │  │  └──────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                       │   │
│  │  Renders globally:                                   │   │
│  │  • AchievementUnlockModal (if showModal)             │   │
│  │  • AchievementToast (if toastAchievement)            │   │
│  │  • MilestoneCelebration (if showMilestoneModal)      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
User Action
    │
    ↓
┌─────────────────┐
│ Lesson Complete │
└─────────────────┘
    │
    ↓
┌──────────────────────────────┐
│ LessonResult                  │
│  {                            │
│    wpm: number                │
│    accuracy: number           │
│    lessonId: string           │
│    completed: boolean         │
│    stars: number (0-3)        │
│  }                            │
└──────────────────────────────┘
    │
    ↓
┌──────────────────────────────┐
│ UserStats (fetched/local)     │
│  {                            │
│    lessonsCompleted: number   │
│    sectionsCompleted: number[]│
│  }                            │
└──────────────────────────────┘
    │
    ↓
┌─────────────────────────────────┐
│ useAchievementChecker()          │
│  Returns: Achievement[]          │
│  [                               │
│    {                             │
│      id: string                  │
│      title: string               │
│      description: string         │
│      category: 'speed' | ...     │
│      points: number              │
│    },                            │
│    ...                           │
│  ]                               │
└─────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────┐
│ AchievementContext               │
│  • Stores achievements           │
│  • Manages display state         │
│  • Coordinates notifications     │
└─────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────┐
│ UI Components                    │
│  • Render modals                 │
│  • Render toasts                 │
│  • Handle animations             │
└─────────────────────────────────┘
```

---

## State Management

```
┌──────────────────────────────────────────────────────────┐
│              AchievementContext State                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  currentAchievement: Achievement | null                  │
│  ↓                                                        │
│  Controls AchievementUnlockModal visibility               │
│                                                           │
│  showModal: boolean                                       │
│  ↓                                                        │
│  True = show modal, False = hide modal                    │
│                                                           │
│  toastAchievement: Achievement | null                     │
│  ↓                                                        │
│  Controls AchievementToast visibility                     │
│                                                           │
│  currentMilestone: Milestone | null                       │
│  ↓                                                        │
│  Controls MilestoneCelebration visibility                 │
│                                                           │
│  showMilestoneModal: boolean                              │
│  ↓                                                        │
│  True = show milestone, False = hide milestone            │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              Lesson Page Local State                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  userStats: UserStats                                     │
│  ↓                                                        │
│  { lessonsCompleted: number, sectionsCompleted: number[] }│
│                                                           │
│  wpm: number                                              │
│  accuracy: number                                         │
│  mistakes: TypingMistake[]                                │
│  currentIndex: number                                     │
│  ...                                                      │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Animation Timeline

### Achievement Modal
```
Time: 0ms
  ↓
Modal: opacity 0 → 1 (700ms spring)
Modal: scale 0 → 1 (700ms spring)
Modal: rotateX -90deg → 0 (700ms spring)
  ↓
Time: 0ms (parallel)
  ↓
Confetti: Start (500 pieces)
  ↓
Time: 0-2000ms
  ↓
Icon: pulse scale 1 → 1.05 → 1 (infinite)
Icon: rotate 0deg → 360deg (infinite)
Glow: opacity 0.5 → 1 → 0.5 (infinite)
  ↓
Time: 5000ms
  ↓
Confetti: Stop & Remove
  ↓
User clicks close
  ↓
Modal: fade out (200ms)
```

### Achievement Toast
```
Time: 0ms
  ↓
Toast: slideInFromTop (300ms)
Toast: scale 0.8 → 1 (300ms)
  ↓
Time: 0-5000ms
  ↓
Progress bar: width 100% → 0% (5000ms linear)
  ↓
Time: 5000ms
  ↓
Toast: fadeOut (200ms)
Toast: scale 1 → 0.8 (200ms)
Toast: removed from DOM
```

### Milestone Celebration
```
Time: 0ms
  ↓
Modal: scale 0 → 1 (800ms spring)
Modal: rotateY -180deg → 0 (800ms spring)
  ↓
Time: 0ms (parallel)
  ↓
Particles (x6): float up + sideways (2-4s infinite)
Background: gradient move (5s infinite)
Icon: pulse scale (2s infinite)
Glow: pulse opacity (2s infinite)
Count: animate with overshoot
  ↓
User clicks "Continue"
  ↓
Modal: fade out (300ms)
```

### Multiple Achievements Stagger
```
Achievement #1 (Modal)
  ↓
Time: 0ms
  ↓
Show modal + confetti
  ↓
Time: 300ms
  ↓
Achievement #2 (Toast)
  ↓
Show toast #1 in top-right
  ↓
Time: 600ms
  ↓
Achievement #3 (Toast)
  ↓
Show toast #2 below toast #1
  ↓
Time: 900ms
  ↓
Achievement #4 (Toast)
  ↓
Show toast #3 below toast #2
  ↓
User closes modal
  ↓
Toasts remain, continue auto-dismiss
```

---

## File Structure

```
apps/frontend/src/
│
├── app/
│   ├── layout.tsx                      ← Wraps with AchievementProvider
│   ├── learn/
│   │   └── [id]/
│   │       └── page.tsx                ← Integrates useAchievementChecker
│   └── test-achievements/
│       └── page.tsx                    ← NEW: Manual testing page
│
├── components/
│   ├── AchievementUnlockModal.tsx      ← Phase 3C: Modal with confetti
│   ├── AchievementToast.tsx            ← Phase 3C: Toast notification
│   └── MilestoneCelebration.tsx        ← Phase 3C: Milestone full-page
│
├── context/
│   └── AchievementContext.tsx          ← Phase 3C: Global state
│
└── hooks/
    └── useAchievementChecker.ts        ← Phase 3C: Detection logic
```

---

## API Integration Points

### Current (Mock)
```typescript
// Fetch user stats
GET http://localhost:5000/api/v1/users/${userId}/stats
→ Returns: { stats: { totalLessonsCompleted, sectionsCompleted } }

// Currently using mock-user-id
const userId = 'mock-user-id';
```

### Future (With Auth)
```typescript
// Get authenticated user
const session = await getServerSession();
const userId = session.user.id;

// Fetch user stats
GET http://localhost:5000/api/v1/users/${userId}/stats

// Save lesson completion
POST http://localhost:5000/api/v1/lessons/complete
Body: { lessonId, wpm, accuracy, completed, achievements }

// Fetch achievement history
GET http://localhost:5000/api/v1/achievements/user/${userId}
```

---

## Testing Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Testing Page (/test-achievements)           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Manual Triggers:                                        │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐      │
│  │  Speed     │  │  Accuracy  │  │  Milestones  │      │
│  │  • 100 WPM │  │  • 98%     │  │  • 10 lessons│      │
│  │  • 120 WPM │  │  • 99%     │  │  • 25 lessons│      │
│  │  • 150 WPM │  │  • 100%    │  │  • 50 lessons│      │
│  └────────────┘  └────────────┘  └──────────────┘      │
│                                                          │
│  Complex Scenarios:                                      │
│  ┌─────────────────────────────────────────────┐        │
│  │ Multiple Achievements (4 at once)            │        │
│  │  → Tests staggering, modal → toast flow     │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│  ┌─────────────────────────────────────────────┐        │
│  │ Achievement + Milestone                      │        │
│  │  → Tests sequential display                 │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
          │
          ↓
    Uses same context
          │
          ↓
┌─────────────────────────────────────────────────────────┐
│           Real Achievement System                        │
│  (Same components, same logic, same animations)          │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Considerations

### Optimization Strategies

1. **Confetti Performance**
   ```
   • Limited to 500 pieces
   • Auto-stops after 5 seconds
   • recycle: false (no reuse overhead)
   • GPU-accelerated (transform, opacity)
   ```

2. **Animation Performance**
   ```
   • Use transform instead of position
   • Use opacity instead of visibility
   • Enable hardware acceleration
   • Limit simultaneous animations
   ```

3. **State Management**
   ```
   • Minimal re-renders
   • Local state where possible
   • Context only for notifications
   • Cleanup timers on unmount
   ```

4. **Component Rendering**
   ```
   • AnimatePresence for mount/unmount
   • Only render when visible
   • Lazy load heavy components (future)
   • React.memo for expensive components (future)
   ```

---

## Accessibility Features

### Current
- ✅ Semantic HTML structure
- ✅ Close buttons with text
- ✅ Keyboard-friendly (clickable)
- ✅ Readable color contrast
- ✅ Dark mode support

### Planned (Phase 3E)
- [ ] ARIA labels for modals
- [ ] ARIA live regions for toasts
- [ ] Keyboard navigation (Tab, Escape)
- [ ] Focus management
- [ ] Screen reader announcements
- [ ] Reduced motion support

---

## Browser Compatibility

### Tested
- ✅ Chrome 120+ (primary)
- ✅ Firefox 121+ (tested)
- ✅ Safari 17+ (tested)
- ✅ Edge 120+ (Chromium)

### Features Used
- ✅ React 18 (all browsers)
- ✅ Framer Motion (all browsers)
- ✅ CSS Grid/Flexbox (all browsers)
- ✅ CSS Custom Properties (all browsers)
- ✅ Backdrop Filter (all browsers)

---

## Mobile Responsiveness

### Breakpoints
```css
/* Mobile First */
base: 0-639px    → Full-width, single column
sm:  640px+      → Larger touch targets
md:  768px+      → Grid layouts, wider modals
lg:  1024px+     → Desktop optimized
xl:  1280px+     → Max-width constraints
2xl: 1536px+     → Extra spacing
```

### Touch Optimization
- 44px minimum touch targets
- Swipe-friendly (no accidental triggers)
- Large close buttons
- No hover-only interactions

---

## Error Handling

### Current
```typescript
try {
  await checkAchievements(result, stats);
} catch (error) {
  console.error('Achievement check failed:', error);
  // Continue normally, don't block user
}
```

### Future (Phase 3E)
```typescript
// Error boundaries
<ErrorBoundary fallback={<AchievementError />}>
  <AchievementProvider>
    {children}
  </AchievementProvider>
</ErrorBoundary>

// Sentry integration
Sentry.captureException(error, {
  context: 'achievement-system',
  extra: { lessonId, userStats }
});
```

---

## Monitoring & Analytics

### Future Tracking
```typescript
// Track achievement unlocks
analytics.track('Achievement Unlocked', {
  achievementId: achievement.id,
  category: achievement.category,
  points: achievement.points,
  lessonId: result.lessonId
});

// Track milestone celebrations
analytics.track('Milestone Reached', {
  type: milestone.type,
  count: milestone.count,
  userId: session.user.id
});

// Performance monitoring
performance.mark('achievement-check-start');
await checkAchievements(result, stats);
performance.mark('achievement-check-end');
performance.measure('achievement-check', 'start', 'end');
```

---

**Architecture Complete!** 🏗️

This system is designed for:
- ⚡ Performance
- 🎨 Delightful UX
- 📱 Mobile-first
- ♿ Accessibility
- 🧪 Testability
- 🔧 Maintainability

Ready for Phase 3E! 🚀
