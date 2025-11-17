# Navigation Implementation - Hybrid Header Component

**Document Version:** 1.0
**Created:** November 5, 2025
**Author:** James (Developer)
**Status:** ✅ Implemented

---

## Overview

Grail Seeker uses a **hybrid navigation system** that adapts intelligently across viewport sizes while maintaining a consistent mental model for users:

- **Hamburger Menu** = App navigation (Dashboard, Searches, Alerts)
- **Avatar Dropdown** = Account actions (Settings, Logout)

This approach solves critical UX problems:

1. **Mobile overflow** - Long email addresses (e.g., irvingforbust@grailteam.testinator.com) no longer crush the layout
2. **Consistent access** - Settings always available via avatar, not hidden on mobile
3. **Professional design** - Centered logo on mobile, left-aligned on desktop

---

## Architecture

### Component Structure

**Location:** `components/layout/Header.tsx`

**Props:**

```typescript
interface HeaderProps {
  user: User // Supabase User object
}
```

**Key Features:**

- Reusable across all authenticated pages
- Responsive design with Tailwind breakpoints (`md:` = 768px)
- Client-side state for menu toggles
- Click-outside detection for avatar dropdown
- Active page highlighting via `usePathname()`

---

## Viewport-Specific Behavior

### Mobile Layout (< 768px)

```
☰  Hamburger        ⚱️ Grail Seeker        👤 Avatar
```

**Hamburger Menu (Left):**

- Opens dropdown with app navigation
- Shows: Dashboard | Searches | Alerts
- Animated hamburger → X transition
- Click outside or navigation closes menu

**Logo (Center):**

- ⚱️ Chalice icon + "Grail Seeker" text
- Clickable link to /dashboard
- Centered for balanced mobile design

**Avatar (Right):**

- Circular badge with user initials
- Opens dropdown with:
  - Email address (full, not truncated)
  - Settings link
  - Logout button
- Click outside closes menu

### Tablet/Desktop Layout (≥ 768px)

```
⚱️ Grail Seeker | Dashboard | Searches | Alerts                    👤 Avatar
```

**Left Section:**

- ⚱️ Chalice icon + "Grail Seeker" logo
- Horizontal navigation: Dashboard | Searches | Alerts
- Active page highlighted in collector-blue

**Right Section:**

- Avatar with initials
- Dropdown with:
  - Email address
  - Settings link
  - Logout button

---

## Implementation Details

### Avatar Initials Logic

Extracts meaningful initials from email addresses:

```typescript
const getInitials = (email: string) => {
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}
```

**Examples:**

- `irving.forbust@example.com` → "IF"
- `john_doe@example.com` → "JD"
- `collector@example.com` → "CO"

### Active Page Detection

Uses Next.js `usePathname()` to highlight current page:

```typescript
const pathname = usePathname()

// In nav links
className={pathname === '/dashboard' ? 'font-medium text-collector-blue' : 'text-slate-700'}
```

### Click-Outside Detection

Avatar dropdown closes when clicking outside:

```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
      setAvatarMenuOpen(false)
    }
  }

  if (avatarMenuOpen) {
    document.addEventListener('mousedown', handleClickOutside)
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside)
  }
}, [avatarMenuOpen])
```

### Menu State Management

```typescript
const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // Hamburger menu
const [avatarMenuOpen, setAvatarMenuOpen] = useState(false) // Avatar dropdown
```

Both menus close when:

- User clicks a navigation link
- User clicks outside menu area
- User clicks menu button again (toggle)

---

## Pages Using Header

All authenticated pages import and use the shared Header component:

### Dashboard

**File:** `app/(authenticated)/dashboard/DashboardClient.tsx`

```tsx
import Header from '@/components/layout/Header'

export default function DashboardClient({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      {/* Page content */}
    </div>
  )
}
```

### Searches

**File:** `app/(authenticated)/searches/SearchesClient.tsx`

- Same pattern as Dashboard

### Alerts

**File:** `app/(authenticated)/alerts/AlertsClient.tsx`

- Same pattern as Dashboard

### Settings

**File:** `app/(authenticated)/settings/SettingsClient.tsx`

- Same pattern as Dashboard
- Settings link appears in avatar dropdown (not top nav)

---

## Styling & Design Tokens

### Colors

```typescript
// Tailwind classes used
'text-collector-navy' // Logo text
'text-collector-blue' // Active links, avatar background
'bg-blue-50' // Hover states
'text-slate-700' // Inactive links, body text
'border-slate-200' // Borders
```

### Spacing

```typescript
'gap-6' // Between logo and nav links
'gap-4' // Between nav links
'px-4 py-4' // Header padding
'h-10 w-10' // Avatar size
```

### Responsive Breakpoints

```typescript
'md:flex' // Show on tablet+ (768px+)
'md:hidden' // Hide on tablet+
```

---

## Accessibility

### Keyboard Navigation

- All interactive elements are focusable
- Tab order: Logo → Nav Links → Avatar
- Enter/Space activate buttons and links

### ARIA Labels

```tsx
<button
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  aria-label="Toggle navigation menu"
>
```

```tsx
<button
  onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
  aria-label="Account menu"
>
```

### Screen Readers

- Logo includes `<h1>` for semantic heading
- Nav wrapped in `<nav>` element
- Button text describes action

---

## Performance Considerations

### Code Splitting

- Header component ~8KB gzipped
- Shared across all pages (loaded once)
- No heavy dependencies

### Re-render Optimization

- Menu state isolated to Header component
- `usePathname()` only re-renders on route change
- No prop drilling - user object passed directly

### Bundle Size

```
Header component:        ~8KB
Dependencies:
  - next/link:           (already loaded)
  - next/navigation:     (already loaded)
  - @supabase/client:    (already loaded)
Total incremental:       ~8KB
```

---

## Testing Checklist

### Desktop (≥ 768px)

- [ ] Logo displays with chalice icon
- [ ] Navigation links visible (Dashboard, Searches, Alerts)
- [ ] Active page highlighted
- [ ] Avatar shows initials
- [ ] Avatar dropdown opens/closes
- [ ] Settings accessible via avatar
- [ ] Logout works
- [ ] Click outside closes avatar menu

### Mobile (< 768px)

- [ ] Hamburger menu visible
- [ ] Logo centered
- [ ] Avatar visible
- [ ] Hamburger opens/closes with animation
- [ ] Hamburger shows all nav links
- [ ] Avatar dropdown shows email + Settings + Logout
- [ ] Long emails don't break layout
- [ ] Click outside closes menus
- [ ] Navigation works (closes menu on click)

### All Viewports

- [ ] Active page detection works
- [ ] Logout redirects to /login
- [ ] All links navigate correctly
- [ ] No console errors
- [ ] Menus don't overlap
- [ ] Z-index hierarchy correct

---

## Future Enhancements

### Potential Improvements

1. **Notifications badge** - Show unread alert count on avatar
2. **Quick search** - Add search input to header
3. **Keyboard shortcuts** - Cmd+K for navigation
4. **Theme toggle** - Dark mode support
5. **User profile photo** - Replace initials with uploaded image

### Mobile Native App

The Header logic (excluding UI) can be reused in React Native:

- Avatar initials function
- Active page detection
- Menu state management
- Logout flow

---

## Troubleshooting

### Issue: Menus don't close

**Solution:** Check click-outside detection is set up correctly. Verify `avatarRef` is attached to the dropdown container.

### Issue: Active page not highlighted

**Solution:** Verify `usePathname()` returns expected path. Check pathname comparison logic.

### Issue: Avatar shows wrong initials

**Solution:** Check user email format. Test `getInitials()` function with edge cases.

### Issue: Layout breaks on small screens

**Solution:** Test at 360px width (smallest modern phone). Ensure Tailwind responsive classes are correct.

---

## Related Documentation

- [Phase 5 Frontend Architecture](../grail-seeker/docs/architecture/phase-5-frontend-architecture.md)
- [Phase 5 Developer Handoff](../grail-seeker/docs/architecture/phase-5-developer-handoff.md)
- [Tailwind Configuration](./tailwind.config.ts)
- [Color Palette](./app/globals.css)

---

## Change Log

| Date       | Version | Changes                                  | Author            |
| ---------- | ------- | ---------------------------------------- | ----------------- |
| 2025-11-05 | 1.0     | Initial hybrid navigation implementation | James (Developer) |
