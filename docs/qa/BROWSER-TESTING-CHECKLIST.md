# Browser Testing Checklist

**Week 6 QA Testing**
**Tester:** Quinn
**Target:** Test all pages across 4 browsers

---

## 📊 Testing Matrix Overview

| Page              | Chrome | Safari macOS | Safari iOS | Firefox | Notes    |
| ----------------- | ------ | ------------ | ---------- | ------- | -------- |
| Login             | ✅     | ⏳           | ⏳         | ⏳      | Baseline |
| Register          | ✅     | ⏳           | ⏳         | ⏳      | Baseline |
| Forgot Password   | ✅     | ⏳           | ⏳         | ⏳      | Baseline |
| Reset Password    | ✅     | ⏳           | ⏳         | ⏳      | Baseline |
| Dashboard         | ✅     | ⏳           | ⏳         | ⏳      | Baseline |
| Searches (List)   | ✅     | ⏳           | ⏳         | ⏳      | Baseline |
| Searches (Create) | ✅     | ⏳           | ⏳         | ⏳      | Baseline |
| Searches (Edit)   | ✅     | ⏳           | ⏳         | ⏳      | Baseline |
| Alerts (List)     | ✅     | ⏳           | ⏳         | ⏳      | Baseline |
| Settings          | ✅     | ⏳           | ⏳         | ⏳      | Baseline |

**Legend:**

- ✅ Passed (no bugs)
- ❌ Failed (bugs found, see bug reports)
- ⏳ Not tested yet
- ⚠️ Minor issues (cosmetic only)

---

## 🌐 Browser 1: Chrome 120+ (Baseline) ✅

**Status:** All pages tested by James (Week 1-5)
**Platform:** macOS
**Viewport:** Desktop (1920x1080)
**Result:** ✅ All passing

You don't need to test Chrome - it's your baseline. If something doesn't work in Safari/Firefox but works in Chrome, that's a browser-specific bug.

---

## 🍎 Browser 2: Safari macOS 17+

**Platform:** macOS
**Viewport:** Desktop (1920x1080)
**Estimated Time:** 3-4 hours

### Authentication Pages

#### Login Page

- [ ] Page loads without errors
- [ ] Email input accepts text
- [ ] Password input accepts text
- [ ] Show/hide password toggle works
- [ ] "Login" button enabled when form valid
- [ ] "Login" button disabled when form invalid
- [ ] Form submission works (redirects to dashboard)
- [ ] Error messages display for invalid credentials
- [ ] "Forgot password?" link navigates correctly
- [ ] "Register" link navigates correctly
- [ ] No console errors
- [ ] Visual layout matches Chrome

**Bugs Found:** _[List bug IDs here]_

---

#### Register Page

- [ ] Page loads without errors
- [ ] Email input validation works (valid format required)
- [ ] Password input validation works (8+ chars required)
- [ ] Confirm password validation works (must match)
- [ ] Show/hide password toggles work (both fields)
- [ ] "Register" button enabled when form valid
- [ ] "Register" button disabled when form invalid
- [ ] Form submission works
- [ ] Success message displays
- [ ] Email confirmation instructions show
- [ ] "Already have an account?" link works
- [ ] No console errors
- [ ] Visual layout matches Chrome

**Bugs Found:** _[List bug IDs here]_

---

#### Forgot Password Page

- [ ] Page loads without errors
- [ ] Email input accepts text
- [ ] Email validation works (valid format required)
- [ ] "Send Reset Link" button enabled when email valid
- [ ] "Send Reset Link" button disabled when email invalid
- [ ] Form submission works
- [ ] Success message displays
- [ ] "Back to login" link works
- [ ] No console errors
- [ ] Visual layout matches Chrome

**Bugs Found:** _[List bug IDs here]_

---

#### Reset Password Page

- [ ] Page loads without errors (with valid token)
- [ ] Page shows error with invalid token
- [ ] New password input accepts text
- [ ] Confirm password input accepts text
- [ ] Show/hide toggles work (both fields)
- [ ] Password validation works (8+ chars, must match)
- [ ] "Reset Password" button enabled when form valid
- [ ] Form submission works
- [ ] Success message displays
- [ ] Auto-redirect to login after 3 seconds
- [ ] No console errors
- [ ] Visual layout matches Chrome

**Bugs Found:** _[List bug IDs here]_

---

### Authenticated Pages

#### Dashboard

- [ ] Page loads without errors
- [ ] Stats cards display correct numbers
- [ ] "Total Searches" stat card is clickable → /searches
- [ ] "Active Monitoring" stat card is clickable → /searches
- [ ] "Alerts Found" stat card is clickable → /alerts
- [ ] Stat cards have hover effects
- [ ] Recent alerts section displays (3 most recent)
- [ ] AlertCards render correctly
- [ ] Alert badges display (🎯 Direct Match, 💎 Near Miss)
- [ ] "View All Alerts" link works → /alerts
- [ ] Search count widget displays
- [ ] Header navigation works
- [ ] Avatar dropdown opens/closes
- [ ] Logout works from dropdown
- [ ] No console errors
- [ ] Visual layout matches Chrome

**Bugs Found:** _[List bug IDs here]_

---

#### Searches Page (List)

- [ ] Page loads without errors
- [ ] Search cards display with correct data
- [ ] Active searches show "Active" badge
- [ ] Paused searches show "Paused" badge
- [ ] Grade range displays with decimals (6.0 - 8.0)
- [ ] Price displays with formatting ($50,000)
- [ ] "Pause" button works (active → paused)
- [ ] "Resume" button works (paused → active)
- [ ] "Edit" button navigates to edit page
- [ ] "Delete" button shows confirmation dialog
- [ ] "Delete" confirmation works (removes search)
- [ ] "Create New Search" button works → /searches/new
- [ ] Empty state shows when no searches
- [ ] No console errors
- [ ] Visual layout matches Chrome

**Bugs Found:** _[List bug IDs here]_

---

#### Searches Page (Create)

- [ ] Page loads without errors
- [ ] Series autocomplete works (type "spider")
- [ ] Series autocomplete shows dropdown
- [ ] Arrow keys navigate autocomplete
- [ ] Enter key selects series
- [ ] Click selects series
- [ ] Issue number input accepts numbers
- [ ] Issue number accepts "nn"
- [ ] Issue number rejects letters
- [ ] Grade min dropdown shows "Any" by default
- [ ] Grade max dropdown shows "Any" by default
- [ ] Grade range auto-corrects (min > max)
- [ ] Page quality dropdown works
- [ ] Grading authority dropdown works
- [ ] Max price input accepts numbers
- [ ] Max price formats on blur ($5,000)
- [ ] Max price placeholder says "Any"
- [ ] Platform checkboxes work (eBay only enabled)
- [ ] "Save Search" button disabled when form invalid
- [ ] "Save Search" button enabled when form valid
- [ ] Form submission works
- [ ] Redirects to /searches after save
- [ ] Validation errors display correctly
- [ ] "Cancel" button returns to /searches
- [ ] No console errors
- [ ] Visual layout matches Chrome

**Bugs Found:** _[List bug IDs here]_

---

#### Searches Page (Edit)

- [ ] Page loads with pre-filled data
- [ ] Series field shows correct series (read-only)
- [ ] Issue number shows correct value
- [ ] Grade min shows correct value
- [ ] Grade max shows correct value
- [ ] Page quality shows correct value
- [ ] Grading authority shows correct value
- [ ] Max price shows correct value (formatted)
- [ ] Platforms show correct selection
- [ ] All fields are editable (except series)
- [ ] Form validation works same as create
- [ ] "Save Changes" button works
- [ ] Redirects to /searches after save
- [ ] Changes persist after save
- [ ] "Cancel" button returns to /searches
- [ ] No console errors
- [ ] Visual layout matches Chrome

**Bugs Found:** _[List bug IDs here]_

---

#### Alerts Page (List)

- [ ] Page loads without errors
- [ ] Alert cards display correctly
- [ ] Direct Match badge (🎯) shows green
- [ ] Near Miss badge (💎) shows blue
- [ ] Near Miss: Price badge shows amber
- [ ] Comic title displays
- [ ] Price displays formatted ($45,000)
- [ ] Grade displays (8.5)
- [ ] Platform displays (eBay)
- [ ] Date displays (Nov 5, 2025)
- [ ] "View on eBay" button works
- [ ] Platform filter dropdown works
- [ ] Match type filter dropdown works
- [ ] Filters apply correctly
- [ ] "Clear Filters" button appears when filters active
- [ ] "Clear Filters" resets filters
- [ ] Load More button works (loads 20 more)
- [ ] Progress indicator shows "Showing X of Y"
- [ ] Back to Top button appears after 20+ alerts
- [ ] Back to Top button scrolls to top
- [ ] Empty state shows when no alerts
- [ ] No console errors
- [ ] Visual layout matches Chrome
- [ ] Cards responsive (button stacks on mobile - test in Safari iOS)

**Bugs Found:** _[List bug IDs here]_

---

#### Settings Page

- [ ] Page loads without errors
- [ ] Tab navigation works (Account, Password, Notifications)
- [ ] **Account Tab:**
  - [ ] Email displays (read-only)
  - [ ] Phone number displays (editable)
  - [ ] Account created date displays
  - [ ] Phone number save works
  - [ ] Phone number validation works
  - [ ] Delete account button shows confirmation
- [ ] **Password Tab:**
  - [ ] Current password input works
  - [ ] New password input works
  - [ ] Confirm password input works
  - [ ] Show/hide toggles work (all 3 fields)
  - [ ] Password validation works (must match)
  - [ ] "Change Password" button works
  - [ ] Success message displays
- [ ] **Notifications Tab:**
  - [ ] SMS toggle works
  - [ ] Near miss alerts toggle works
  - [ ] Quiet hours inputs work (start/end time)
  - [ ] "Save Preferences" button works
  - [ ] Settings persist after save
- [ ] No console errors
- [ ] Visual layout matches Chrome

**Bugs Found:** _[List bug IDs here]_

---

## 📱 Browser 3: Safari iOS 17+

**Platform:** iOS (iPhone or iPad)
**Viewport:** Mobile (375px - 768px)
**Estimated Time:** 3-4 hours

### Mobile-Specific Checks (Test on ALL pages)

- [ ] **Hamburger Menu:**
  - [ ] Hamburger icon displays (mobile only)
  - [ ] Tap opens navigation menu
  - [ ] Navigation links work
  - [ ] Tap outside closes menu

- [ ] **Avatar Dropdown:**
  - [ ] Avatar icon displays in header
  - [ ] Tap opens dropdown menu
  - [ ] Settings link works
  - [ ] Logout link works
  - [ ] Tap outside closes dropdown

- [ ] **Touch Targets:**
  - [ ] All buttons are easy to tap (48px+ height)
  - [ ] No accidental taps on adjacent elements
  - [ ] Links are tappable

- [ ] **Forms:**
  - [ ] Input fields don't zoom on focus
  - [ ] Keyboard doesn't cover inputs
  - [ ] Submit buttons visible with keyboard open
  - [ ] Autocomplete dropdowns work with touch

- [ ] **Layout:**
  - [ ] No horizontal scrolling on any page
  - [ ] Content fits within viewport
  - [ ] Buttons stack vertically when needed
  - [ ] Cards are full-width on mobile

- [ ] **AlertCard (Alerts page):**
  - [ ] "View on eBay" button stacks below content
  - [ ] Button is full-width on mobile
  - [ ] Card height is consistent

### Test All Pages (Same as Safari macOS)

Use the same checklist as Safari macOS above, but focus on mobile-specific issues:

- Layout breaks
- Touch target sizes
- Form input zoom
- Keyboard overlapping content
- Hamburger menu functionality

**Notes:** You can skip detailed functional testing if Safari macOS passed. Focus on mobile-specific UI/UX issues.

**Bugs Found:** _[List bug IDs here]_

---

## 🦊 Browser 4: Firefox 120+

**Platform:** macOS or Windows
**Viewport:** Desktop (1920x1080)
**Estimated Time:** 2-3 hours

### Known Firefox Differences to Watch For:

- CSS Grid/Flexbox rendering differences
- Form input styling (especially dropdowns)
- Date/time pickers look different
- Scrollbar styling
- Font rendering (may look slightly different)

### Test All Pages (Same as Safari macOS)

Use the same checklist as Safari macOS above. Focus on:

- Visual layout differences
- Form element rendering
- Dropdown styling
- Button states
- Any JavaScript errors in console

**Bugs Found:** _[List bug IDs here]_

---

## 📋 Summary Report Template

After testing all browsers, fill this out:

### Browsers Tested

- [x] Chrome 120+ (Baseline - tested by James)
- [ ] Safari 17+ macOS
- [ ] Safari 17+ iOS
- [ ] Firefox 120+

### Pages Tested

- [ ] Login (4/4 browsers)
- [ ] Register (4/4 browsers)
- [ ] Forgot Password (4/4 browsers)
- [ ] Reset Password (4/4 browsers)
- [ ] Dashboard (4/4 browsers)
- [ ] Searches List (4/4 browsers)
- [ ] Searches Create (4/4 browsers)
- [ ] Searches Edit (4/4 browsers)
- [ ] Alerts List (4/4 browsers)
- [ ] Settings (4/4 browsers)

### Total Test Combinations

- **Total:** 40 (10 pages × 4 browsers)
- **Completed:** _[X/40]_
- **Passed:** _[X/40]_
- **Failed:** _[X/40]_

### Bugs Found by Severity

- **Critical:** _[count]_ bugs
- **High:** _[count]_ bugs
- **Medium:** _[count]_ bugs
- **Low:** _[count]_ bugs
- **Total:** _[count]_ bugs

### Recommendation

- [ ] ✅ Ready for Week 7 (no critical bugs, minor issues only)
- [ ] ⚠️ Needs fixes before Week 7 (some high-priority bugs)
- [ ] ❌ Not ready (critical bugs found, needs another testing round)

### Notes

_[Any general observations, patterns, or recommendations]_

---

## 💡 Testing Tips

**Efficient Testing:**

1. Test one browser completely before moving to next
2. Use browser DevTools (F12) to check console errors
3. Take screenshots of bugs immediately
4. Use responsive design mode for quick mobile testing
5. Clear browser cache between tests to avoid false positives

**What to Look For:**

- Visual differences (layout, spacing, colors)
- Broken functionality (buttons don't work)
- Console errors (JavaScript exceptions)
- Slow performance (sluggish interactions)
- Missing features (something works in Chrome but not Safari)

**When to Report:**

- **Immediately:** Critical bugs (crashes, data loss)
- **Same day:** High priority bugs (features don't work)
- **End of day:** Medium/low priority bugs (cosmetic issues)

---

**Happy Testing, Quinn! 🧪**
