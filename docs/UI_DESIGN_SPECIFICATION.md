# Modern Typing Test UI - Visual Design Specification

## Component Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    [30 Sec] [1 Min] [3 Min]                        │
│                    Duration Selection Buttons                       │
│                                                                     │
│   ┌──────────┐         ┌──────────┐         ┌──────────┐          │
│   │    45    │         │   98%    │         │  01:30   │          │
│   │   WPM    │         │ Accuracy │         │   Time   │          │
│   └──────────┘         └──────────┘         └──────────┘          │
│                      Metrics Display                                │
│                                                                     │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │                                                            │   │
│   │  The quick brown fox jumps over the lazy dog. The        │   │
│   │  quick brown fox jumps over the lazy dog.|Pack my        │   │
│   │  box with five dozen liquor jugs. How quickly daft      │   │
│   │  zebras jump...                                          │   │
│   │                                                            │   │
│   │  ▼ Auto-scrolls as you type                              │   │
│   └────────────────────────────────────────────────────────────┘   │
│                   Typing Text Container                             │
│                  (Fixed height, scrollable)                         │
│                                                                     │
│                    [Restart Test] Button                            │
│                   (Only during test)                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme & Styling

### Duration Buttons

- **Active State**:
  - Background: `bg-primary` (blue)
  - Text: `bg-primary-foreground` (white)
  - Effect: `shadow-lg scale-105` (slightly enlarged with shadow)
- **Inactive State**:
  - Background: `bg-muted` (light gray)
  - Text: `text-muted-foreground` (dark gray)
  - Hover: `bg-muted/80` (slightly darker)

- **Disabled State** (during test):
  - Opacity: `opacity-50`
  - Cursor: `cursor-not-allowed`

### Metrics Cards

- **Number Display**:
  - Font Size: `text-4xl` (36px)
  - Font Weight: `font-bold`
  - Color: `text-primary` (blue)

- **Label Display**:
  - Font Size: `text-sm` (14px)
  - Color: `text-muted-foreground` (gray)
  - Margin: `mt-1` (4px top)

### Text Container

- **Dimensions**:
  - Width: `max-w-[800px]` (responsive)
  - Height: `h-48` (12rem / 192px fixed)
- **Border & Background**:
  - Border: `border-2 border-border`
  - Background: `bg-card`
  - Border Radius: `rounded-xl` (12px)
  - Shadow: `shadow-2xl`
- **Typography**:
  - Font: `font-mono` (monospace)
  - Size: `text-2xl` (24px)
  - Line Height: `leading-relaxed`
  - Letter Spacing: `tracking-wide`

### Character Colors

| State     | Light Mode       | Dark Mode        |
| --------- | ---------------- | ---------------- |
| Untyped   | `text-gray-500`  | `text-gray-400`  |
| Correct   | `text-green-500` | `text-green-400` |
| Incorrect | `text-red-500`   | `text-red-400`   |

### Cursor

- **Appearance**: Vertical bar `│`
- Width: `w-0.5` (2px)
- Height: `h-full` (100% of character height)
- Color: `bg-primary` (matches theme)
- Animation: `animate-blink` (1s step-end infinite)

---

## Finished State Overlay

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│           ┌──────────────────────────────┐            │
│           │                              │            │
│           │    Test Finished!            │            │
│           │                              │            │
│           │  WPM: 45                     │            │
│           │  Accuracy: 98%               │            │
│           │  Errors: 3                   │            │
│           │                              │            │
│           │  [Take Another Test]         │            │
│           │                              │            │
│           └──────────────────────────────┘            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Overlay Styling:

- Background: `bg-background/95 backdrop-blur-sm` (semi-transparent with blur)
- Card: `bg-card rounded-2xl shadow-2xl border-2 border-primary`
- Title: `text-4xl font-bold text-primary`
- Metrics: `text-2xl` with color-coded values
  - WPM & Accuracy: `text-green-500`
  - Errors: `text-red-500`

---

## Responsive Behavior

### Desktop (> 1024px)

- Text container: Full `800px` width
- Metrics: Horizontal layout with `space-x-12`
- All features fully visible

### Tablet (768px - 1024px)

- Text container: Responsive width with padding
- Metrics: Maintained horizontal layout
- Buttons: Full size

### Mobile (< 768px)

- Text container: Full width with padding
- Metrics: May stack vertically
- Font sizes: Slightly reduced
- Buttons: Full width stacked

---

## Animation & Transitions

### Button Hover

```css
transition-all duration-200
hover:bg-muted/80
```

### Button Active State

```css
scale-105 /* Slightly enlarged */
```

### Cursor Blink

```css
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
animation: blink 1s step-end infinite;
```

### Loading State

```css
animate-pulse /* Pulsing opacity effect */
```

### Finished Overlay

```css
backdrop-blur-sm /* Blurred background */
```

---

## Interaction Flow

1. **Initial Load**
   - Shows "Loading test..." with pulse animation
   - Fetches text from API
   - Displays text with all characters in gray

2. **User Clicks Duration**
   - Resets test
   - Fetches new text for selected duration
   - Auto-focuses hidden input field

3. **User Types First Character**
   - Timer starts (status → 'in-progress')
   - Cursor appears at current position
   - Character turns green (correct) or red (incorrect)
   - WPM/Accuracy begin calculating

4. **During Test**
   - Cursor follows typing position
   - Text auto-scrolls when cursor near edge
   - Metrics update in real-time (every 100ms)
   - "Restart Test" button visible

5. **Test Completion**
   - Overlay appears with results
   - Shows final WPM, Accuracy, Errors
   - "Take Another Test" button available

6. **Time Expires**
   - Test auto-ends
   - Same overlay as completion

---

## Dark Mode Support

All colors use Tailwind's CSS variables:

### Light Mode

- Background: White (`--background: 0 0% 100%`)
- Text: Dark gray (`--foreground: 222.2 84% 4.9%`)
- Primary: Blue (`--primary: 221.2 83.2% 53.3%`)
- Card: White with subtle border

### Dark Mode

- Background: Very dark blue (`--background: 222.2 84% 4.9%`)
- Text: Off-white (`--foreground: 210 40% 98%`)
- Primary: Lighter blue (`--primary: 217.2 91.2% 59.8%`)
- Card: Dark blue with lighter border

All character colors have `dark:` variants for proper contrast.

---

## Accessibility Features

1. **Screen Reader Support**
   - Hidden input field with `aria-hidden="true"`
   - Semantic HTML structure
   - Proper heading hierarchy

2. **Keyboard Navigation**
   - Auto-focus on test start
   - No tabindex conflicts
   - Clear visual focus indicators

3. **Color Contrast**
   - High contrast for all text (WCAG AA compliant)
   - Clear differentiation between states
   - Works in both light and dark modes

4. **Motion Preferences**
   - Smooth transitions (can be disabled via user preferences)
   - Pulse animations for non-critical feedback

---

## Technical Implementation Details

### Text Rendering

```typescript
{textToType.split('').map((char, index) => {
  let charClass = 'text-gray-500 dark:text-gray-400';
  if (index < userInput.length) {
    charClass = char === userInput[index]
      ? 'text-green-500 dark:text-green-400'
      : 'text-red-500 dark:text-red-400';
  }

  const isCurrentChar = index === userInput.length && status === 'in-progress';

  return (
    <span key={index} className={cn(charClass, 'relative inline-block char-span')}>
      {char === ' ' ? '\u00A0' : char}
      {isCurrentChar && (
        <span className="absolute left-0 top-0 w-0.5 h-full bg-primary animate-blink" />
      )}
    </span>
  );
})}
```

### Auto-Scroll Logic

```typescript
useEffect(() => {
  if (textContainerRef.current && userInput.length > 0) {
    const container = textContainerRef.current;
    const textNodes = Array.from(container.querySelectorAll('.char-span'));
    const cursorIndex = userInput.length;

    if (cursorIndex < textNodes.length) {
      const currentCursorSpan = textNodes[cursorIndex] as HTMLElement;
      if (currentCursorSpan) {
        const containerRect = container.getBoundingClientRect();
        const cursorRect = currentCursorSpan.getBoundingClientRect();

        // Scroll down if cursor near bottom
        if (cursorRect.bottom > containerRect.bottom - 20) {
          container.scrollTop += cursorRect.bottom - containerRect.bottom + 40;
        }
        // Scroll up if cursor near top (backspacing)
        if (cursorRect.top < containerRect.top + 20) {
          container.scrollTop -= containerRect.top - cursorRect.top + 40;
        }
      }
    }
  }
}, [userInput]);
```

### Timer Start on First Keypress

```typescript
const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;

  // Start timer on first keypress
  if (status === 'waiting' && value.length > 0 && !startTime) {
    startTimer();
  }

  setUserInput(value);
};
```

---

## Performance Optimizations

1. **useCallback** for fetchAndStartTest - Prevents unnecessary re-renders
2. **Memoized calculations** in Zustand store - WPM/Accuracy calculated once per input change
3. **Efficient scroll calculation** - Only runs when userInput changes
4. **100ms timer interval** - Balance between smoothness and performance
5. **CSS animations** - Hardware-accelerated for smooth cursor blink

---

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

All modern CSS features (backdrop-blur, CSS variables) are supported.
