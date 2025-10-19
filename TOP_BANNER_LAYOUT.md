# Top Banner Layout

## Current Layout

The top banner now has a consistent height across all elements:

### Components:

1. **UserProfile (Sign In Button)** - Top Right
   - Location: `fixed top-4 right-8 z-[100]`
   - Height: `h-12` (48px)
   - File: `src/components/UserProfile.tsx`
   - Features:
     - Sign In button when not authenticated
     - User avatar + username when authenticated
     - Dropdown with stats, progress, and options

2. **GlobalHealthBar** - Top Center
   - Location: `fixed top-4 left-1/2 -translate-x-1/2 z-[100]`
   - Height: `h-12` (48px)
   - File: `src/components/GlobalHealthBar.tsx`
   - Features:
     - Earth health emoji (💩/🌍/🦸)
     - Health percentage
     - Tooltip with detailed stats

### Z-Index Hierarchy:
- Both components: `z-[100]` (top layer)

### Alignment:
- Both positioned at `top-4` (16px from top)
- Same height `h-12` (48px)
- Creates a consistent horizontal top banner

---

## Future Enhancement Ideas

### Option 1: Full Top Banner Component

Create a unified top banner component that contains all header elements:

```tsx
// src/components/TopBanner.tsx
export function TopBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 z-[100] pointer-events-none">
      <div className="h-full px-8 flex items-center justify-between pointer-events-auto">
        {/* Left: Logo or App Name */}
        <div className="glass-panel rounded-xl h-12 px-4 flex items-center gap-2">
          <span className="text-xl">🌍</span>
          <span className="font-bold">Globe Critter</span>
        </div>

        {/* Center: Global Health Bar */}
        <GlobalHealthBar />

        {/* Right: User Profile */}
        <UserProfile />
      </div>
    </div>
  );
}
```

### Option 2: Add Navigation Links

Add navigation items between the health bar and user profile:

- 🏠 Home
- 📚 Learn
- 🏆 Achievements
- 🌎 Explore

### Option 3: Profile Icon Enhancement

When implementing profile features, consider:

**User Profile Dropdown Sections:**
- ✅ Already implemented:
  - Avatar + username
  - Health contribution progress
  - Total lessons completed
  - View Profile, My Badges, Progress menu items

- 🔮 Future additions:
  - Recent activity feed
  - Friend list / social features
  - Settings / preferences
  - Notification center
  - Currency/points display

**Profile Page Route:**
Create a dedicated profile page at `/profile` or `/user/:username` with:
- Full stats dashboard
- Badge collection display
- Activity history
- Contributions over time (graph)
- Achievements timeline
- Settings panel

### Option 4: Notification Bell Icon

Add a notification icon next to the user profile:

```tsx
<div className="fixed top-4 right-24 z-[100] pointer-events-auto">
  <Button variant="outline" className="glass-panel rounded-xl h-12 w-12 relative">
    <Bell className="h-5 w-5" />
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {unreadCount}
      </span>
    )}
  </Button>
</div>
```

---

## Implementation Notes

### Maintaining Consistent Heights:
- All top banner elements should use `h-12` (48px) for consistency
- All positioned at `top-4` (16px from top)
- Use `glass-panel` class for unified styling
- Use `rounded-xl` for consistent border radius

### Z-Index Strategy:
- Top banner: `z-[100]`
- Food web selection bar: `z-[95]` (under health bar)
- Map controls: `z-[60]`
- Species carousel: `z-[60]`
- Bottom chat: `z-30`

### Responsive Considerations:
For mobile/tablet views, consider:
- Collapsing banner to smaller height
- Hiding secondary elements
- Making profile dropdown full-screen overlay
- Stacking elements vertically

---

## Files to Modify for Banner Enhancements

1. **src/components/TopBanner.tsx** (create new)
   - Unified banner container
   - Manages all header elements

2. **src/pages/Index.tsx**
   - Replace individual header elements with `<TopBanner />`
   - Adjust spacing for content below banner

3. **src/components/UserProfile.tsx** (already in place)
   - Already has dropdown with stats
   - Add profile page navigation link

4. **src/components/GlobalHealthBar.tsx** (already in place)
   - Already has tooltip with stats
   - Consider adding click action to show detailed health dashboard

5. **src/pages/Profile.tsx** (create new)
   - Full-page profile view
   - User stats dashboard
   - Badge collection
   - Settings

---

## Current Status

✅ **Completed:**
- Global Health Bar and Sign In button aligned at same height
- Both use `h-12` (48px)
- Both positioned at `top-4` (16px from top)
- Consistent styling with `glass-panel` effect

🔮 **Future Work:**
- Create unified TopBanner component
- Add profile page route
- Add notification system
- Add navigation menu
- Consider logo/branding

---

**Last Updated:** October 16, 2025
**Status:** Layout aligned and ready for future enhancements
