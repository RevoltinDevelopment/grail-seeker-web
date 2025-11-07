# QA Documentation - Week 6 Testing
**Welcome, Quinn!** This folder contains everything you need for Week 6 QA testing.

---

## 📁 What's in This Folder?

### 1. WEEK-6-TESTING-GUIDE.md ⭐ **START HERE**
**Your main testing guide**
- Quick start (15 minutes to get going)
- Cross-browser testing instructions
- Edge case testing overview
- Success criteria
- Help and troubleshooting

**Read this first!**

---

### 2. TEST-CREDENTIALS.md 🔐
**Login credentials and test data**
- Test user accounts (3 pre-configured)
- Pre-loaded searches and alerts
- Test values for forms (prices, grades, etc.)
- Comic series for testing autocomplete
- Troubleshooting login issues

**Read this second** to get your test credentials.

---

### 3. BROWSER-TESTING-CHECKLIST.md ✅
**Interactive checklist for cross-browser testing**
- Testing matrix (10 pages × 4 browsers)
- Detailed checklist for each page
- Mobile-specific checks
- Summary report template

**Use this while testing** each browser. Check off items as you go!

---

### 4. EDGE-CASE-SCENARIOS.md 🔬
**32 edge case scenarios to break the app**
- Priority 1: Critical (12 scenarios) - must test
- Priority 2: High (8 scenarios) - should test
- Priority 3: Medium (12 scenarios) - nice to test
- Detailed steps for each scenario
- Expected vs actual behavior

**Use this for edge case testing** after cross-browser testing.

---

### 5. BUG-REPORT-TEMPLATE.md 🐛
**Template for reporting bugs**
- Structured format for consistency
- All required fields explained
- Examples of good bug reports
- Submission instructions (GitHub or markdown file)

**Use this to report every bug you find.**

---

### 6. README.md 📖 (this file)
**Overview of QA documentation**

---

## 🚀 Quick Start Guide

**New to this project? Follow these steps:**

### Step 1: Read Documentation (30 min)
1. Read `WEEK-6-TESTING-GUIDE.md` (15 min)
2. Read `TEST-CREDENTIALS.md` (5 min)
3. Skim `BROWSER-TESTING-CHECKLIST.md` (5 min)
4. Skim `EDGE-CASE-SCENARIOS.md` (5 min)

### Step 2: Set Up Environment (15 min)
1. Verify servers running:
   - Backend: http://localhost:3000/health/liveness
   - Frontend: http://localhost:3001
2. Install browsers:
   - Chrome (already have)
   - Safari (built-in on Mac)
   - Firefox (download if needed)
3. Get test devices:
   - iPhone or iPad for Safari iOS testing

### Step 3: Verify Baseline (15 min)
1. Open Chrome
2. Navigate to http://localhost:3001
3. Login with: `quinn.qa@grailseeker.io` / `TestPass123!`
4. Navigate through all pages
5. Verify everything works in Chrome
6. **If Chrome doesn't work:** Stop and notify James

### Step 4: Start Testing! 🎯
1. Choose browser: Safari macOS, Safari iOS, or Firefox
2. Open `BROWSER-TESTING-CHECKLIST.md`
3. Test all pages for that browser
4. Check off items as you go
5. Report bugs using `BUG-REPORT-TEMPLATE.md`
6. Repeat for next browser

### Step 5: Edge Case Testing 🔬
1. Open `EDGE-CASE-SCENARIOS.md`
2. Start with Priority 1 (Critical) scenarios
3. Work through Priority 2 and 3 as time permits
4. Report all bugs found

### Step 6: Wrap Up 📝
1. Fill out summary report in `BROWSER-TESTING-CHECKLIST.md`
2. Compile list of all bugs found
3. Provide recommendation (ready for Week 7 or more work needed)
4. Submit to James for review

**Total Time:** 8-16 hours depending on thoroughness

---

## 📊 Testing Scope

### What You're Testing
**11 Pages:**
1. Login
2. Register
3. Forgot Password
4. Reset Password
5. Dashboard
6. Searches (List)
7. Searches (Create)
8. Searches (Edit)
9. Alerts (List)
10. Settings

**4 Browsers:**
1. Chrome 120+ (baseline - already tested)
2. Safari 17+ (macOS)
3. Safari 17+ (iOS)
4. Firefox 120+

**32 Edge Cases:**
- Empty states
- Network failures
- Invalid inputs
- Boundary values
- Form validation
- And more...

**Total Test Combinations:** 40 page/browser combos + 32 edge cases

---

## 🎯 Your Goals

**By end of Week 6:**
- [ ] Test all 10 pages across 4 browsers (40 combinations)
- [ ] Test all Priority 1 edge cases (12 scenarios)
- [ ] Test as many Priority 2/3 edge cases as time allows
- [ ] Report all bugs found
- [ ] Provide recommendation for Week 7

**Expected Bugs:** 10-20 bugs (mostly CSS/layout, a few logic bugs)

**Expected Outcome:** Ready for Week 7 polish or additional fixes

---

## 🐛 How to Report Bugs

**Three Options:**

### Option 1: GitHub Issue (Recommended) ⭐
1. Go to: https://github.com/RevoltinDevelopment/grail-seeker-web/issues
2. Click "New Issue"
3. Select "Bug Report" template
4. Fill out template
5. Add label: `week-6-qa`
6. Submit

### Option 2: Markdown File
1. Copy `BUG-REPORT-TEMPLATE.md`
2. Fill it out completely
3. Save as: `BUG-W6-XXX-description.md`
4. Place in: `docs/qa/bugs/` folder
5. Commit to git or send to James

### Option 3: Direct to James
1. Copy `BUG-REPORT-TEMPLATE.md`
2. Fill it out
3. Email or Slack to James
4. Attach screenshots

**Always include:**
- Browser + version
- Steps to reproduce
- Expected vs actual
- Screenshot (if visual)
- Console errors (if any)

---

## 📁 Folder Structure

```
docs/qa/
├── README.md                          ← You are here
├── WEEK-6-TESTING-GUIDE.md           ← Main guide (start here)
├── TEST-CREDENTIALS.md               ← Login info
├── BROWSER-TESTING-CHECKLIST.md     ← Interactive checklist
├── EDGE-CASE-SCENARIOS.md            ← Edge cases to test
├── BUG-REPORT-TEMPLATE.md            ← Bug report format
├── bugs/                             ← Save bug reports here
│   └── (bug reports go here)
└── screenshots/                      ← Save screenshots here
    └── (screenshots go here)
```

---

## 🆘 Need Help?

**If you're stuck:**
1. Check the main guide: `WEEK-6-TESTING-GUIDE.md`
2. Check project status: `/docs/PROJECT-STATUS.md`
3. Check Winston's assessment: `/docs/FRONTEND-COMPLETION-ASSESSMENT.md`
4. Ask James (developer)

**Common Questions:**

**Q: Servers won't start**
A: Ask James to restart them (known issue)

**Q: Can't login**
A: Check `TEST-CREDENTIALS.md` for correct email/password

**Q: How long should this take?**
A: 8-16 hours total (flexible based on thoroughness)

**Q: What if I find a critical bug?**
A: Report immediately to James (don't wait)

**Q: Do I need to test everything?**
A: Prioritize: All browsers for critical pages, then edge cases

---

## 📚 Related Documentation

**In this folder:**
- All QA-specific docs

**In project root:**
- `/docs/PROJECT-STATUS.md` - Single source of truth
- `/docs/FRONTEND-COMPLETION-ASSESSMENT.md` - Winston's review
- `/docs/MOBILE-TESTING-WEEK-5.md` - James's mobile testing

**Architecture docs:**
- `/docs/architecture/phase-5-developer-handoff.md` - Implementation details
- `/docs/architecture/coding-standards.md` - Code quality standards
- `/docs/architecture/tech-stack.md` - Technology stack

---

## ✅ Pre-Testing Checklist

Before you start testing:
- [ ] Read main testing guide
- [ ] Have test credentials
- [ ] Servers are running (backend + frontend)
- [ ] Chrome baseline verified (everything works)
- [ ] Browsers installed (Safari, Firefox)
- [ ] Test device ready (iPhone/iPad for Safari iOS)
- [ ] Screenshots folder created (`docs/qa/screenshots/`)
- [ ] Bug tracking method chosen (GitHub issues recommended)

---

## 📈 Progress Tracking

**Mark your progress:**

### Documentation Read
- [ ] WEEK-6-TESTING-GUIDE.md
- [ ] TEST-CREDENTIALS.md
- [ ] BROWSER-TESTING-CHECKLIST.md
- [ ] EDGE-CASE-SCENARIOS.md
- [ ] BUG-REPORT-TEMPLATE.md

### Cross-Browser Testing
- [ ] Safari macOS (all 10 pages)
- [ ] Safari iOS (all 10 pages + mobile checks)
- [ ] Firefox (all 10 pages)

### Edge Case Testing
- [ ] Priority 1: Critical (12 scenarios)
- [ ] Priority 2: High (8 scenarios)
- [ ] Priority 3: Medium (12 scenarios)

### Deliverables
- [ ] All bugs reported
- [ ] Summary report completed
- [ ] Recommendation provided
- [ ] Handoff to James

---

## 🎯 Success Criteria

**You're done when:**
- All browsers tested across all pages
- All Priority 1 edge cases tested
- All bugs reported with complete information
- Summary report submitted
- Recommendation provided (ready for Week 7 or needs more work)

**Expected Timeline:** Nov 6-13, 2025 (1 week)

---

**Good luck, Quinn! You've got this! 🚀**

If you have questions about this documentation, ask James.
