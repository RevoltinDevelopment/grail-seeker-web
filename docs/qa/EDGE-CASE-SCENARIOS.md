# Edge Case Testing Scenarios

**Week 6 QA Testing**
**Tester:** Quinn
**Purpose:** Find bugs by testing unusual inputs and scenarios

---

## 🎯 Testing Philosophy

**Edge cases are where bugs hide!** Normal users don't just enter valid data. They:

- Leave fields blank
- Enter way-too-long text
- Mash buttons multiple times
- Lose internet connection mid-action
- Try to break things (intentionally or not)

Your job: **Try to break the application.** If it breaks, that's a bug!

---

## Priority 1: Critical (Must Test)

### 1. Empty States 👻

**Goal:** Verify UI handles "no data" gracefully

#### Scenario 1A: New User (No Searches)

1. Login with: `quinn.empty@grailseeker.io`
2. Go to Dashboard
3. **Expected:** Empty state shows for searches
4. **Expected:** Stats show 0 for searches
5. **Expected:** No crashes, clear call-to-action ("Create your first search")

**Check:**

- [ ] Dashboard shows empty state
- [ ] "Create New Search" button present
- [ ] No broken layout
- [ ] No console errors

---

#### Scenario 1B: New User (No Alerts)

1. Login with: `quinn.empty@grailseeker.io`
2. Go to Alerts page
3. **Expected:** Empty state shows
4. **Expected:** Message like "No alerts yet" or "We're searching for your grails"
5. **Expected:** No crashes

**Check:**

- [ ] Alerts page shows empty state
- [ ] No broken layout
- [ ] No console errors

---

#### Scenario 1C: Search with No Results

1. Login with: `quinn.qa@grailseeker.io`
2. Go to Alerts page
3. Apply filters: Platform = "Heritage Auctions"
4. **Expected:** Empty state shows (Heritage not implemented yet)
5. **Expected:** Message explains no results found

**Check:**

- [ ] Empty state shows for filtered results
- [ ] Can clear filters to see results again
- [ ] No console errors

---

### 2. Network Failures 📡

**Goal:** Verify app handles network issues gracefully

#### Scenario 2A: Disconnect During Form Submit

1. Login with: `quinn.qa@grailseeker.io`
2. Go to Create Search page
3. Fill out form completely
4. **BEFORE clicking Save:** Disconnect WiFi/internet
5. Click "Save Search"
6. **Expected:** Error message displays
7. **Expected:** Form data not lost
8. **Expected:** Can reconnect and retry

**Check:**

- [ ] Error message shows (not infinite spinner)
- [ ] Form data still present (not cleared)
- [ ] Can retry after reconnecting
- [ ] No crash or blank screen

---

#### Scenario 2B: Disconnect on Page Load

1. Disconnect WiFi/internet
2. Navigate to http://localhost:3001/dashboard
3. **Expected:** Error message or offline indicator
4. **Expected:** Graceful failure (not blank page)

**Check:**

- [ ] Error message shows
- [ ] Page doesn't hang forever
- [ ] Can recover after reconnecting

---

#### Scenario 2C: Slow Network

1. Open DevTools (F12) → Network tab
2. Throttle to "Slow 3G"
3. Navigate through app (Dashboard → Searches → Alerts)
4. **Expected:** Loading indicators show
5. **Expected:** No timeouts or crashes
6. **Expected:** Data eventually loads

**Check:**

- [ ] Loading spinners show during fetch
- [ ] No "undefined" or broken data
- [ ] Eventually loads (may take 10-30 seconds)
- [ ] No console errors

---

### 3. Invalid Inputs (Security) 🔒

**Goal:** Verify app sanitizes/rejects malicious inputs

#### Scenario 3A: SQL Injection Attempt

1. Go to Create Search page
2. In Series autocomplete, type: `'; DROP TABLE users; --`
3. **Expected:** Treated as normal search text
4. **Expected:** No database errors
5. **Expected:** No actual SQL execution

**Check:**

- [ ] Input treated as plain text
- [ ] No 500 errors
- [ ] No console errors about SQL
- [ ] Series autocomplete returns no results (safe)

---

#### Scenario 3B: XSS Attempt (Cross-Site Scripting)

1. Go to Create Search page
2. Try to create search with series containing: `<script>alert('XSS')</script>`
3. **Expected:** Script tags escaped/sanitized
4. **Expected:** No alert popup
5. **Expected:** Displays as plain text if saved

**Check:**

- [ ] No JavaScript execution
- [ ] No alert popup
- [ ] Text displayed safely (escaped)

---

#### Scenario 3C: HTML Injection

1. Go to Settings → Account tab
2. Try to set phone number to: `<img src=x onerror=alert('hacked')>`
3. **Expected:** Input rejected or escaped
4. **Expected:** No image rendering
5. **Expected:** No JavaScript execution

**Check:**

- [ ] HTML not rendered
- [ ] Input sanitized or rejected
- [ ] No console errors

---

### 4. Boundary Values 📊

**Goal:** Test extreme values at data limits

#### Scenario 4A: Price = $0

1. Create search with Max Price = $0
2. **Expected:** Accepts $0 as valid
3. **Expected:** Saves successfully
4. **Expected:** Displays as "$0" in searches list

**Check:**

- [ ] $0 accepted
- [ ] Saves without error
- [ ] Displays correctly

---

#### Scenario 4B: Price = $999,999,999

1. Create search with Max Price = $999,999,999
2. **Expected:** Accepts very large number
3. **Expected:** Formats correctly ($999,999,999)
4. **Expected:** Saves successfully

**Check:**

- [ ] Large number accepted
- [ ] Formatting works (commas)
- [ ] No integer overflow errors

---

#### Scenario 4C: Price = Negative Number

1. Create search with Max Price = -$500
2. **Expected:** Rejected (validation error)
3. **Expected:** Error message displays
4. **Expected:** Form submit disabled

**Check:**

- [ ] Negative number rejected
- [ ] Validation error shows
- [ ] Cannot submit form

---

#### Scenario 4D: Issue Number = 0

1. Create search with Issue Number = 0
2. **Expected:** Accepts 0 as valid issue
3. **Expected:** Saves successfully

**Check:**

- [ ] 0 accepted
- [ ] Saves without error

---

#### Scenario 4E: Grade Range = Same Value

1. Create search with Grade Min = 6.0, Grade Max = 6.0
2. **Expected:** Accepts same min/max
3. **Expected:** Saves as 6.0 - 6.0
4. **Expected:** Matches only grade 6.0

**Check:**

- [ ] Same value accepted
- [ ] Displays correctly
- [ ] No auto-correction

---

## Priority 2: High (Should Test)

### 5. Form Validation 📝

#### Scenario 5A: Submit Empty Required Fields

1. Go to Create Search page
2. Click "Save Search" immediately (no fields filled)
3. **Expected:** Button disabled (grayed out)
4. **Expected:** Cannot submit
5. **Expected:** Validation messages show which fields required

**Check:**

- [ ] Submit button disabled
- [ ] Required field indicators show (red asterisks)
- [ ] No form submission

---

#### Scenario 5B: Invalid Email Format

1. Go to Register page
2. Enter email: `notanemail`
3. Tab to next field
4. **Expected:** Validation error shows
5. **Expected:** "Register" button disabled

**Check:**

- [ ] Email validation error shows
- [ ] Button disabled
- [ ] Error message helpful ("Please enter valid email")

---

#### Scenario 5C: Password Mismatch

1. Go to Reset Password page (with valid token)
2. Enter New Password: `Test123!`
3. Enter Confirm Password: `Different123!`
4. **Expected:** Validation error shows "Passwords must match"
5. **Expected:** Submit button disabled

**Check:**

- [ ] Mismatch error shows
- [ ] Button disabled
- [ ] Error clears when passwords match

---

### 6. Grade Range Edge Cases 🎯

#### Scenario 6A: Min > Max (Auto-Correction)

1. Create search
2. Set Grade Min = 8.0
3. Set Grade Max = 6.0 (less than min)
4. **Expected:** Auto-corrects Max to 8.0 (matches min)
5. **Expected:** Or shows validation error

**Check:**

- [ ] Auto-correction works OR validation error shows
- [ ] No confusing state (min > max doesn't save)
- [ ] User gets feedback about correction

---

#### Scenario 6B: "Any" Min + Specific Max

1. Create search
2. Set Grade Min = Any (null)
3. Set Grade Max = 8.0
4. **Expected:** Accepts this combination
5. **Expected:** Saves as 0.5 - 8.0 (Any = 0.5 for min)

**Check:**

- [ ] Combination accepted
- [ ] Saves correctly
- [ ] Displays as "Any - 8.0" in UI

---

#### Scenario 6C: Specific Min + "Any" Max

1. Create search
2. Set Grade Min = 6.0
3. Set Grade Max = Any (null)
4. **Expected:** Accepts this combination
5. **Expected:** Saves as 6.0 - 10.0 (Any = 10.0 for max)

**Check:**

- [ ] Combination accepted
- [ ] Saves correctly
- [ ] Displays as "6.0 - Any" in UI

---

### 7. Long Strings & Special Characters 📏

#### Scenario 7A: Very Long Series Name

1. Search for series with 200+ character name
2. **Expected:** Autocomplete handles gracefully
3. **Expected:** Dropdown doesn't break layout
4. **Expected:** Text truncates with ellipsis if needed

**Check:**

- [ ] Long text doesn't break UI
- [ ] Autocomplete still works
- [ ] Saved search displays correctly

---

#### Scenario 7B: Special Characters in Search

1. Search for series: `G.I. Joe: A Real American Hero`
2. **Expected:** Periods and colons handled correctly
3. **Expected:** Autocomplete finds series
4. **Expected:** Saves without errors

**Check:**

- [ ] Special chars work
- [ ] Search finds correct series
- [ ] No encoding issues

---

#### Scenario 7C: Emoji in Input

1. Try to set phone number with emoji: `555-1234 😊`
2. **Expected:** Rejects emoji (phone validation)
3. **Expected:** Shows validation error

**Check:**

- [ ] Emoji rejected
- [ ] Validation error shows
- [ ] Doesn't save invalid data

---

### 8. Series Autocomplete Edge Cases 🔍

#### Scenario 8A: No Results

1. Type nonsense in series autocomplete: `xyzabc123`
2. **Expected:** "No results found" message
3. **Expected:** Dropdown shows empty state
4. **Expected:** No console errors

**Check:**

- [ ] Empty state shows
- [ ] Message is helpful
- [ ] No errors

---

#### Scenario 8B: Very Fast Typing

1. Type very quickly: `amazingspiderman` (no pause)
2. **Expected:** Debouncing works (doesn't fire 18 API calls)
3. **Expected:** Results show after typing stops
4. **Expected:** No duplicate requests

**Check:**

- [ ] Debouncing works (~300ms delay)
- [ ] Only 1-2 API calls (not 18)
- [ ] Results accurate

---

#### Scenario 8C: Keyboard Navigation

1. Type `spider` in series autocomplete
2. Press Down Arrow to highlight first result
3. Press Down Arrow again to highlight second
4. Press Enter to select
5. **Expected:** Selected series fills form
6. **Expected:** Keyboard navigation smooth

**Check:**

- [ ] Arrow keys navigate dropdown
- [ ] Enter selects highlighted item
- [ ] Escape closes dropdown
- [ ] Tab moves to next field

---

## Priority 3: Medium (Nice to Test)

### 9. Concurrent Actions 🔄

#### Scenario 9A: Double-Click Submit

1. Fill out Create Search form
2. Double-click "Save Search" button rapidly
3. **Expected:** Only submits once (no duplicate searches)
4. **Expected:** Button disables after first click

**Check:**

- [ ] No duplicate saves
- [ ] Button disabled during submit
- [ ] Only one search created

---

#### Scenario 9B: Edit Same Search in Two Tabs

1. Login in Tab 1
2. Open Tab 2 (same session)
3. Navigate to same search in both tabs
4. Edit search in Tab 1, save
5. Edit search in Tab 2, save
6. **Expected:** Last save wins (Tab 2 overwrites Tab 1)
7. **Expected:** Or shows conflict warning

**Check:**

- [ ] Handles concurrent edits
- [ ] No data corruption
- [ ] User gets feedback

---

#### Scenario 9C: Delete While Editing

1. Open search in Edit page (Tab 1)
2. Open Searches List (Tab 2)
3. Delete the search in Tab 2
4. Try to save in Tab 1
5. **Expected:** Shows error "Search not found"
6. **Expected:** Graceful failure (not crash)

**Check:**

- [ ] Error message shows
- [ ] No crash
- [ ] User understands what happened

---

### 10. Session & Auth Edge Cases 🔐

#### Scenario 10A: Session Timeout

1. Login
2. Leave tab idle for 30+ minutes
3. Try to create search or perform action
4. **Expected:** Session expired message
5. **Expected:** Redirects to login
6. **Expected:** Can login again and continue

**Check:**

- [ ] Session timeout detected
- [ ] Redirect to login
- [ ] No data loss if possible

---

#### Scenario 10B: Logout in One Tab

1. Login in Tab 1
2. Open Tab 2 (same session)
3. Logout in Tab 1
4. Try action in Tab 2
5. **Expected:** Detects logout
6. **Expected:** Redirects to login

**Check:**

- [ ] Logout detected across tabs
- [ ] Redirect to login
- [ ] No confusing state

---

#### Scenario 10C: Invalid Token

1. Manually edit URL to Reset Password with invalid token
2. Navigate to: `http://localhost:3001/reset-password?token=invalid123`
3. **Expected:** Shows error "Invalid or expired token"
4. **Expected:** Provides link back to forgot password
5. **Expected:** Doesn't show form

**Check:**

- [ ] Invalid token detected
- [ ] Error message clear
- [ ] User path to recovery

---

### 11. Browser Navigation Edge Cases ↩️

#### Scenario 11A: Back Button After Submit

1. Create new search, submit
2. Redirects to /searches
3. Click browser Back button
4. **Expected:** Returns to form OR shows warning
5. **Expected:** Doesn't re-submit (no duplicate)

**Check:**

- [ ] Back button works
- [ ] No duplicate submission
- [ ] UX makes sense

---

#### Scenario 11B: Refresh During Save

1. Fill out Create Search form
2. Click "Save Search"
3. Immediately refresh page (Cmd+R)
4. **Expected:** Save might fail OR complete
5. **Expected:** No partial/corrupted data
6. **Expected:** Clear state after refresh

**Check:**

- [ ] No corrupted data
- [ ] Clear error or success state
- [ ] Can retry if failed

---

#### Scenario 11C: Direct URL Access (Unauthorized)

1. Logout completely
2. Manually navigate to: `http://localhost:3001/dashboard`
3. **Expected:** Redirects to /login
4. **Expected:** Shows message "Please login to continue"
5. **Expected:** After login, redirects to dashboard (original destination)

**Check:**

- [ ] Auth middleware works
- [ ] Redirect to login
- [ ] Return to original destination after login

---

### 12. Filter & Pagination Edge Cases 📄

#### Scenario 12A: Apply Multiple Filters

1. Go to Alerts page
2. Apply Platform filter: eBay
3. Apply Match Type filter: Direct Match
4. **Expected:** Shows only eBay + Direct Match alerts
5. **Expected:** Count updates
6. **Expected:** Can clear filters

**Check:**

- [ ] Multiple filters work together (AND logic)
- [ ] Count accurate
- [ ] Clear filters works

---

#### Scenario 12B: Load More at Boundary

1. Go to Alerts page
2. Load More until all alerts loaded
3. **Expected:** "Load More" button disappears
4. **Expected:** Shows "Showing X of X alerts" (same number)
5. **Expected:** No error when clicking Load More at end

**Check:**

- [ ] Button hides at end
- [ ] No errors
- [ ] Count accurate

---

#### Scenario 12C: Filter Reset After Load More

1. Go to Alerts page
2. Click Load More (now showing 40 alerts)
3. Apply filter (Platform: eBay)
4. **Expected:** Resets to first 20 alerts (filtered)
5. **Expected:** Count resets
6. **Expected:** Can Load More again

**Check:**

- [ ] Filter resets pagination
- [ ] Shows first page of filtered results
- [ ] Load More works after filter

---

## 📋 Edge Case Testing Summary

**After testing, fill this out:**

### Priority 1: Critical (12 scenarios)

- [ ] Empty States (3 scenarios) - _[X/3 tested]_
- [ ] Network Failures (3 scenarios) - _[X/3 tested]_
- [ ] Invalid Inputs (3 scenarios) - _[X/3 tested]_
- [ ] Boundary Values (5 scenarios) - _[X/5 tested]_

### Priority 2: High (8 scenarios)

- [ ] Form Validation (3 scenarios) - _[X/3 tested]_
- [ ] Grade Range Edge Cases (3 scenarios) - _[X/3 tested]_
- [ ] Long Strings (3 scenarios) - _[X/3 tested]_
- [ ] Autocomplete Edge Cases (3 scenarios) - _[X/3 tested]_

### Priority 3: Medium (12 scenarios)

- [ ] Concurrent Actions (3 scenarios) - _[X/3 tested]_
- [ ] Session & Auth (3 scenarios) - _[X/3 tested]_
- [ ] Browser Navigation (3 scenarios) - _[X/3 tested]_
- [ ] Filter & Pagination (3 scenarios) - _[X/3 tested]_

**Total:** 32 edge case scenarios
**Completed:** _[X/32]_
**Bugs Found:** _[count]_

### Recommendation

- [ ] ✅ App handles edge cases well (minor issues only)
- [ ] ⚠️ Some edge cases need fixing (medium priority)
- [ ] ❌ Critical edge cases broken (high priority fixes needed)

---

## 💡 General Testing Tips

**How to Think Like a Breaker:**

- What happens if I leave this blank?
- What if I enter way too much text?
- What if I lose internet right now?
- What if I click this button 10 times?
- What if I enter malicious code?
- What if I do things in weird order?

**Good Edge Cases to Always Test:**

- Zero (0)
- Negative numbers (-1)
- Empty string ("")
- Null/undefined
- Very large numbers (999999999)
- Very long strings (200+ chars)
- Special characters (', ", <, >, &)
- Emoji and Unicode
- Whitespace only (" ")

**Report Any:**

- Crashes or blank screens
- Data loss or corruption
- Security vulnerabilities
- Confusing error messages
- Silent failures (no error shown)

---

**Happy Breaking, Quinn! 🔨**
