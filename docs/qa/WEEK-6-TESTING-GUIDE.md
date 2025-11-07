# Week 6 QA Testing Guide
**Tester:** Quinn (QA)
**Target Completion:** November 13, 2025
**Scope:** Cross-browser testing + Edge case testing
**Application Status:** 75% complete, production-ready for beta launch

---

## 🎯 Your Mission

Test the Grail Seeker frontend across multiple browsers and edge cases to find bugs before beta launch. James has built Weeks 1-5 features (all core functionality works in Chrome). Your job is to validate it works everywhere else and breaks gracefully when things go wrong.

**What you're testing:**
- ✅ Core features built (Weeks 1-5)
- 🔍 Cross-browser compatibility (Safari, Firefox)
- 🔍 Edge cases and error states
- 🔍 Mobile browsers (Safari iOS)
- 🔍 Slow network conditions
- 🔍 Invalid inputs and boundary values

---

## 📋 Quick Start (15 Minutes)

### Step 1: Get Access (5 min)
1. **Test Credentials** - See `TEST-CREDENTIALS.md`
2. **Application URLs:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
3. **Test Data** - Pre-loaded searches and alerts available

### Step 2: Verify Chrome Baseline (5 min)
Before testing other browsers, verify everything works in Chrome (this is your baseline):
- [ ] Can login with test credentials
- [ ] Can create a new search
- [ ] Can view alerts
- [ ] Dashboard loads with data

**If Chrome doesn't work:** Stop and notify James (baseline broken)
**If Chrome works:** Proceed to cross-browser testing

### Step 3: Choose Your Testing Path (5 min)
Pick one based on time/resources:

**Option A: Full Testing** (Recommended - 12-16 hours)
- Cross-browser testing (6-8 hours)
- Edge case testing (6-8 hours)

**Option B: Critical Path Only** (Quick - 6-8 hours)
- Safari iOS + macOS only (4 hours)
- Top 10 edge cases (2-4 hours)

**Option C: Parallel Testing** (Efficient - 8-10 hours)
- Day 1: Safari (all pages)
- Day 2: Firefox (all pages)
- Day 3: Edge cases (all scenarios)

---

## 🌐 Cross-Browser Testing

### Browsers to Test

| Browser | Version | Platform | Priority | Time Estimate |
|---------|---------|----------|----------|---------------|
| Chrome 120+ | Desktop | macOS | ✅ Baseline | 0 min (already done) |
| Safari 17+ | Desktop | macOS | 🔴 High | 3-4 hours |
| Safari 17+ | Mobile | iOS | 🔴 High | 3-4 hours |
| Firefox 120+ | Desktop | macOS/Windows | 🟡 Medium | 2-3 hours |

**Total Estimate:** 8-11 hours for all browsers

### What to Test Per Browser

For each browser, test these pages (in order):

**Authentication (30 min per browser):**
1. Login page - Email/password, show/hide toggle
2. Register page - Form validation, email format
3. Forgot password - Email submission
4. Reset password - Token validation, password change

**Authenticated Pages (2-3 hours per browser):**
1. Dashboard - Stats cards, recent alerts, clickable navigation
2. Searches page - List, create, edit, pause/resume, delete
3. Alerts page - List, filtering, Load More pagination
4. Settings page - 3 tabs (Account, Password, Notifications)

**Mobile-Specific (Safari iOS only - 1 hour):**
- [ ] Hamburger menu opens/closes
- [ ] Avatar dropdown works
- [ ] Forms don't zoom on input focus
- [ ] Touch targets are 48px+ (easy to tap)
- [ ] No horizontal scrolling
- [ ] Buttons stack properly on small screens

### How to Test

**For each page:**
1. Navigate to the page
2. Check visual layout (no broken CSS)
3. Try all interactive elements (buttons, dropdowns, inputs)
4. Verify data loads correctly
5. Check console for errors (F12 → Console)
6. Take screenshot if bug found

**Log bugs using:** `BUG-REPORT-TEMPLATE.md`

---

## 🔬 Edge Case Testing

See `EDGE-CASE-SCENARIOS.md` for detailed scenarios.

**Quick Overview (Priority Order):**

### Priority 1: Critical (Must Test - 3 hours)
1. **Empty States** - No searches, no alerts, new user experience
2. **Network Failures** - Disconnect WiFi mid-action
3. **Invalid Inputs** - SQL injection, XSS, special characters
4. **Boundary Values** - Price: $0, $999,999,999, negative numbers

### Priority 2: High (Should Test - 2 hours)
5. **Form Validation** - Required fields, email format, password strength
6. **Grade Ranges** - Min > Max, both "Any", edge grades (0.5, 10.0)
7. **Slow Network** - Throttle to "Slow 3G" in DevTools
8. **Long Strings** - Series names with 200+ characters

### Priority 3: Medium (Nice to Test - 2 hours)
9. **Concurrent Actions** - Open in 2 tabs, edit same search
10. **Session Timeout** - Leave idle for 30 minutes
11. **Back Button** - Navigate back after form submission
12. **Refresh Mid-Action** - Refresh while saving

**Total Estimate:** 6-8 hours for all edge cases

---

## 📊 Testing Matrix (Use This as Checklist)

See `BROWSER-TESTING-CHECKLIST.md` for the full interactive checklist.

**Quick View:**
```
Page              | Chrome | Safari macOS | Safari iOS | Firefox
------------------|--------|--------------|------------|--------
Login             |   ✅   |      ⏳      |     ⏳     |   ⏳
Register          |   ✅   |      ⏳      |     ⏳     |   ⏳
Dashboard         |   ✅   |      ⏳      |     ⏳     |   ⏳
Searches (List)   |   ✅   |      ⏳      |     ⏳     |   ⏳
Searches (Create) |   ✅   |      ⏳      |     ⏳     |   ⏳
Searches (Edit)   |   ✅   |      ⏳      |     ⏳     |   ⏳
Alerts (List)     |   ✅   |      ⏳      |     ⏳     |   ⏳
Settings          |   ✅   |      ⏳      |     ⏳     |   ⏳
```

Mark ✅ when passing, ❌ when bugs found, ⏳ when not yet tested.

---

## 🐛 How to Report Bugs

**Use the bug report template:** `BUG-REPORT-TEMPLATE.md`

**Or create GitHub issue:**
1. Go to: https://github.com/RevoltinDevelopment/grail-seeker-web/issues
2. Click "New Issue"
3. Select "Bug Report" template
4. Fill out all sections
5. Add label: `week-6-qa`

**What James needs from you:**
- Browser + version (e.g., "Safari 17.2 on macOS")
- Steps to reproduce (numbered list)
- Expected vs actual behavior
- Screenshot or video (if visual bug)
- Console errors (if any)
- Severity: Critical / High / Medium / Low

**Severity Guide:**
- **Critical:** App crashes, data loss, security issue → Report immediately
- **High:** Feature doesn't work, blocks user workflow → Report same day
- **Medium:** Visual bug, minor inconvenience → Report within 2 days
- **Low:** Typo, spacing issue, cosmetic → Report end of week

---

## ⚙️ Test Environment Setup

### Required Tools

**Browsers:**
- [ ] Chrome 120+ (already have)
- [ ] Safari 17+ (macOS - built-in)
- [ ] Firefox 120+ (download from mozilla.org)
- [ ] Safari iOS (iPhone or iPad)

**Developer Tools:**
- [ ] Browser DevTools (F12 or Cmd+Opt+I)
- [ ] Network throttling (in DevTools → Network tab)
- [ ] Responsive design mode (for mobile testing)

**Optional but Helpful:**
- [ ] Screenshot tool (built-in: Cmd+Shift+4 on Mac)
- [ ] Screen recording (QuickTime on Mac)
- [ ] Note-taking app (for tracking bugs)

### Environment Variables

**If testing locally, verify these are set:**
```bash
# In grail-seeker-web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://twitplasyaijgnvkylfm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[provided separately]
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Servers must be running:**
- Backend: http://localhost:3000 (check: http://localhost:3000/health/liveness)
- Frontend: http://localhost:3001

---

## 🚨 Known Issues (Don't Report These)

These are already known and documented:

1. **Backend server hangs occasionally**
   - Impact: Development only
   - Workaround: Restart server (ask James)
   - Status: Will be fixed with PM2 in production

2. **No error monitoring yet**
   - Impact: Console errors only
   - Status: Sentry planned for Week 8

3. **Only tested in Chrome so far**
   - Impact: Expected Safari/Firefox bugs
   - Status: That's what you're testing! 🎯

4. **No cross-browser testing done**
   - Impact: Expect CSS differences
   - Status: Report any visual inconsistencies

---

## 📈 Progress Tracking

**Daily Standup Questions:**
1. What browsers did you test yesterday?
2. How many bugs did you find?
3. Any blockers? (server down, missing credentials, etc.)
4. What are you testing today?

**Weekly Summary (due Nov 13):**
- Browsers tested: X/4 complete
- Pages tested: X/11 complete
- Edge cases tested: X/12 complete
- Bugs found: X total (X critical, X high, X medium, X low)
- Recommendation: Ready for Week 7? Y/N

---

## 🎯 Success Criteria

**You're done when:**
- [ ] All 4 browsers tested across 11 pages (44 combinations)
- [ ] Top 10 edge cases tested
- [ ] All bugs reported with template
- [ ] Weekly summary submitted
- [ ] Recommendation provided (ready for Week 7 or more testing needed)

**Expected Outcome:**
- Find 10-20 bugs (normal for Week 6)
- Most will be CSS/layout issues (Safari quirks)
- A few might be logic bugs (edge cases)
- Zero critical bugs expected (core features work)

---

## 🆘 Need Help?

**If you're blocked:**
1. Check `TROUBLESHOOTING.md` in main docs
2. Ask James (developer)
3. Check Winston's assessment: `FRONTEND-COMPLETION-ASSESSMENT.md`

**Common Questions:**

**Q: Server won't start**
A: Ask James to restart backend server (known issue)

**Q: Can't login**
A: Check `TEST-CREDENTIALS.md` for correct email/password

**Q: Where do I report bugs?**
A: Use `BUG-REPORT-TEMPLATE.md` or create GitHub issue

**Q: How long should this take?**
A: 8-16 hours total (depends on how thorough you want to be)

**Q: What if I find a critical bug?**
A: Report immediately to James (don't wait)

**Q: What if everything works perfectly?**
A: Great! But keep testing edge cases - something always breaks 😄

---

## 📚 Related Documentation

**Before you start:**
- [ ] Read `TEST-CREDENTIALS.md` (get login info)
- [ ] Read `BROWSER-TESTING-CHECKLIST.md` (interactive checklist)
- [ ] Read `EDGE-CASE-SCENARIOS.md` (what to break)

**For reference:**
- Winston's assessment: `FRONTEND-COMPLETION-ASSESSMENT.md`
- Mobile testing (Week 5): `MOBILE-TESTING-WEEK-5.md`
- Project status: `/docs/PROJECT-STATUS.md`

**For bug reporting:**
- Bug template: `BUG-REPORT-TEMPLATE.md`
- GitHub issues: https://github.com/RevoltinDevelopment/grail-seeker-web/issues

---

## ✅ Week 6 Testing Checklist

**Pre-Testing Setup:**
- [ ] Read this guide completely
- [ ] Get test credentials
- [ ] Verify Chrome baseline works
- [ ] Install Firefox
- [ ] Have iPhone/iPad ready for Safari iOS

**Cross-Browser Testing:**
- [ ] Safari macOS (all 11 pages)
- [ ] Safari iOS (all 11 pages + mobile-specific)
- [ ] Firefox (all 11 pages)

**Edge Case Testing:**
- [ ] Empty states (Priority 1)
- [ ] Network failures (Priority 1)
- [ ] Invalid inputs (Priority 1)
- [ ] Boundary values (Priority 1)
- [ ] Form validation (Priority 2)
- [ ] Grade ranges (Priority 2)
- [ ] Slow network (Priority 2)
- [ ] Long strings (Priority 2)
- [ ] Concurrent actions (Priority 3)
- [ ] Session timeout (Priority 3)

**Wrap-Up:**
- [ ] All bugs reported
- [ ] Weekly summary written
- [ ] Recommendation provided
- [ ] Handoff to James for fixes

---

**Good luck, Quinn! You've got this! 🚀**

If you find any typos in this guide itself, just let James know. Happy testing!
