# Bug Report Template
**Use this template for all Week 6 QA bug reports**

---

## Bug ID: BUG-W6-[NUMBER]

**Example:** BUG-W6-001, BUG-W6-002, etc.

---

## 📋 Bug Information

### Title
**One-line summary of the bug (50 chars max)**

Example: "Grade dropdown shows 0.5 instead of Any on mobile Safari"

---

### Severity
**Choose one:**
- [ ] 🔴 **Critical** - App crashes, data loss, security issue, blocks all users
- [ ] 🟠 **High** - Feature doesn't work, blocks major workflow, affects many users
- [ ] 🟡 **Medium** - Feature partially works, workaround exists, affects some users
- [ ] 🟢 **Low** - Cosmetic issue, typo, minor inconvenience, affects few users

---

### Category
**Choose one:**
- [ ] Browser Compatibility
- [ ] Mobile Responsive
- [ ] Form Validation
- [ ] Network/API
- [ ] Authentication
- [ ] UI/Visual
- [ ] Performance
- [ ] Security
- [ ] Data/Logic
- [ ] Other: _______________

---

## 🌍 Environment

### Browser
- **Browser:** _____________ (e.g., Safari, Firefox, Chrome)
- **Version:** _____________ (e.g., 17.2)
- **Platform:** _____________ (e.g., macOS 14.1, iOS 17.2, Windows 11)

### Device (if mobile)
- **Device:** _____________ (e.g., iPhone 14 Pro, iPad Air)
- **Screen Size:** _____________ (e.g., 375px, 768px, 1920px)

### Application
- **Frontend URL:** http://localhost:3001
- **Backend URL:** http://localhost:3000
- **User Account:** _____________ (e.g., quinn.qa@grailseeker.io)

---

## 🔍 Bug Details

### Description
**What is the bug? Describe in 2-3 sentences.**

Example:
"When creating a new search on Safari iOS, the Grade Min dropdown shows '0.5' instead of 'Any' as the default value. This is incorrect - the field should display 'Any' by default and only convert to 0.5 on form submission."

---

### Steps to Reproduce
**Numbered list of exact steps to recreate the bug**

Example:
1. Open Safari on iPhone (iOS 17.2)
2. Navigate to http://localhost:3001/login
3. Login with: quinn.qa@grailseeker.io
4. Navigate to /searches/new
5. Observe the Grade Min dropdown
6. **Bug appears:** Shows "0.5" instead of "Any"

---

### Expected Behavior
**What SHOULD happen?**

Example:
"Grade Min dropdown should show 'Any' as the default selected value."

---

### Actual Behavior
**What ACTUALLY happens?**

Example:
"Grade Min dropdown shows '0.5' as the default selected value."

---

### Frequency
**How often does this happen?**
- [ ] Always (100% of the time)
- [ ] Often (75% of the time)
- [ ] Sometimes (50% of the time)
- [ ] Rarely (25% of the time)
- [ ] Once (unable to reproduce)

---

## 📸 Evidence

### Screenshots
**Attach screenshots showing the bug**

Example:
```
[Screenshot 1: Grade dropdown showing 0.5]
Filename: bug-w6-001-grade-dropdown.png

[Screenshot 2: Expected behavior in Chrome]
Filename: bug-w6-001-chrome-comparison.png
```

**How to attach:**
- Save screenshots to: `docs/qa/screenshots/`
- Name them: `bug-w6-[NUMBER]-description.png`
- Reference them here

---

### Console Errors
**Copy any errors from browser console (F12 → Console)**

Example:
```javascript
TypeError: Cannot read property 'value' of null
    at GradeRangeSelector.tsx:45
    at handleChange
```

**If no errors:** Write "No console errors"

---

### Network Errors
**Copy any failed API requests (F12 → Network tab)**

Example:
```
GET http://localhost:3000/api/searches
Status: 500 Internal Server Error
Response: {"error": "Database connection failed"}
```

**If no errors:** Write "No network errors"

---

## 🔬 Analysis

### Root Cause (if known)
**Do you know what's causing this? (Optional)**

Example:
"The useState hook in CreateSearchPage.tsx is initializing with 0.5 instead of null on lines 30-31."

**If unknown:** Write "Unknown - needs investigation"

---

### Impact
**Who is affected and how?**

Example:
"All users on Safari iOS creating new searches will see incorrect default values. May cause confusion about grade ranges. Users can still select 'Any' manually, so workaround exists."

---

### Suggested Fix (optional)
**How would you fix this? (Optional)**

Example:
"Change line 30 in CreateSearchPage.tsx from:
`const [gradeMin, setGradeMin] = useState<number | null>(0.5)`
to:
`const [gradeMin, setGradeMin] = useState<number | null>(null)`"

**If no suggestion:** Write "No suggestion"

---

## 🔗 Related Information

### Related Bugs
**Are there other bugs similar to this?**

Example:
"Possibly related to BUG-W6-003 (Grade Max also showing wrong default)"

**If none:** Write "None"

---

### Blocked By
**Does this bug prevent testing other features?**

Example:
"Blocks testing of grade range auto-correction on Safari iOS"

**If none:** Write "None"

---

### Workaround
**Can users work around this bug?**

Example:
"Yes - users can manually select 'Any' from the dropdown. Not ideal but functional."

**If none:** Write "No workaround"

---

## ✅ Testing Notes

### Tested In
**What browsers/devices did you test?**

Example:
- [x] Safari iOS 17.2 (iPhone 14 Pro) - **BUG PRESENT**
- [x] Safari macOS 14.1 - **BUG PRESENT**
- [x] Chrome macOS - Works correctly (shows "Any")
- [x] Firefox macOS - Works correctly (shows "Any")

---

### Regression Risk
**Could fixing this break something else?**

Example:
"Low risk - isolated to grade field defaults. Should not affect other features."

---

## 📝 Additional Notes

**Any other relevant information**

Example:
"This bug was introduced in Week 5. Previous versions (Week 1-4) did not have this issue. James mentioned this was fixed on Nov 6, but the fix may not have been deployed yet."

---

## 👤 Reporter Information

- **Reported By:** Quinn (QA)
- **Date:** _____________
- **Time:** _____________
- **Contact:** quinn@grailseeker.io (if questions)

---

## 🔄 Status Tracking (For James)

**Leave this section blank - James will fill it out**

### Status
- [ ] 🆕 New (not reviewed)
- [ ] ✅ Confirmed (reproduced by dev)
- [ ] 🔧 In Progress (being fixed)
- [ ] ✔️ Fixed (awaiting verification)
- [ ] ✅ Verified (tested and working)
- [ ] ❌ Won't Fix (by design or not a bug)
- [ ] 🔄 Deferred (fix in future release)

### Assigned To
**Developer:** _____________

### Fix Commit
**Git Commit:** _____________

### Fixed In Version
**Version:** _____________

### Verified By
**Tester:** _____________
**Date:** _____________

---

## 📋 Quick Checklist

Before submitting this bug report, verify:
- [ ] Bug ID assigned (BUG-W6-XXX)
- [ ] Severity selected
- [ ] Category selected
- [ ] Browser/platform info complete
- [ ] Steps to reproduce are clear and numbered
- [ ] Expected vs actual behavior described
- [ ] Screenshot attached (if visual bug)
- [ ] Console errors copied (if any)
- [ ] Impact described
- [ ] Tested in multiple browsers (if applicable)
- [ ] Reporter info filled out

---

## 📤 How to Submit

**Option 1: Create GitHub Issue (Preferred)**
1. Go to: https://github.com/RevoltinDevelopment/grail-seeker-web/issues
2. Click "New Issue"
3. Select "Bug Report" template
4. Copy this completed template into the issue
5. Add label: `week-6-qa`
6. Submit

**Option 2: Save as Markdown File**
1. Save this file as: `BUG-W6-XXX-short-description.md`
2. Place in: `docs/qa/bugs/`
3. Commit to git or send to James

**Option 3: Send to James Directly**
1. Copy this completed template
2. Email or Slack to James
3. Include screenshots as attachments

---

## 💡 Bug Reporting Tips

**Good Bug Reports Have:**
- Clear, specific titles
- Exact steps to reproduce
- Expected vs actual behavior
- Screenshots (for visual bugs)
- Console errors (for technical bugs)
- Tested in multiple browsers

**Bad Bug Reports Have:**
- Vague descriptions ("It doesn't work")
- Missing steps to reproduce
- No browser/device info
- No screenshots
- Mixed multiple bugs in one report

**Remember:**
- One bug per report
- Be specific and detailed
- Assume developer hasn't seen the bug
- Include everything needed to reproduce
- Don't editorialize ("This is a terrible bug") - just state facts

---

**Thank you for thorough bug reporting, Quinn! 🐛**
