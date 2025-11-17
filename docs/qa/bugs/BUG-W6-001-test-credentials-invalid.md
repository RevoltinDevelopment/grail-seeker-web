# BUG-W6-001: Test Credentials Invalid

**Date:** November 7, 2025
**Reporter:** Quinn (QA)
**Severity:** 🔴 **HIGH**
**Status:** ✅ RESOLVED
**Browser:** Safari 17.2, Chrome 120+
**Environment:** Local Development

---

## Summary

Test account `quinn.qa@grailseeker.io` cannot login. Authentication returns "Invalid login credentials" error despite credentials being documented in TEST-CREDENTIALS.md.

---

## Steps to Reproduce

1. Navigate to http://localhost:3001/login
2. Enter email: `quinn.qa@grailseeker.io`
3. Enter password: `TestPass123!`
4. Click "Login" button

---

## Expected Behavior

- User should successfully login
- Redirect to /dashboard
- See pre-loaded test data (5 searches, 12 alerts per TEST-CREDENTIALS.md)

---

## Actual Behavior

- Error message: "Invalid login credentials"
- User remains on login page
- No access to application

---

## Impact

**User Impact:**

- QA testing blocked - cannot test with documented test account
- All 3 test accounts affected (quinn.qa@, quinn.empty@, quinn.concurrent@)
- Forces QA to use non-standard accounts (irving.forbush@)

**Business Impact:**

- Week 6 QA testing delayed
- Cannot test empty state scenarios (quinn.empty@ account)
- Cannot test concurrent sessions (quinn.concurrent@ account)

---

## Root Cause Analysis

**Hypothesis:** Test accounts were never created in Supabase Auth.

**Evidence:**

- TEST-CREDENTIALS.md documents these accounts as existing
- Login fails with "Invalid login credentials" (not "Email not confirmed")
- Same error across all browsers
- Same error for all 3 test accounts

**Verification Needed:**

- Check Supabase Auth dashboard for user accounts
- Verify if accounts exist but have wrong password
- Check if test data seeding script was executed

---

## Browser/Environment Details

**Tested On:**

- Chrome 120+ (macOS) - FAIL
- Safari 17.2 (macOS) - FAIL

**Environment:**

- Frontend: http://localhost:3001
- Backend: http://localhost:3000 (healthy)
- Supabase: twitplasyaijgnvkylfm.supabase.co

**Console Errors:** None (authentication handled by Supabase)

---

## Workaround

**Current Workaround:**
Use existing account: `irving.forbush@grailteam.testinator.com`

- This account works and has test data
- **BUT:** See BUG-W6-002 for data sync issues with this account

---

## Recommended Fix

**Immediate (James):**

1. Create test accounts in Supabase Auth:
   - quinn.qa@grailseeker.io / TestPass123!
   - quinn.empty@grailseeker.io / TestPass123!
   - quinn.concurrent@grailseeker.io / TestPass123!
2. Mark emails as confirmed (skip verification)
3. Run test data seeding script for quinn.qa@ account:
   - 5 searches
   - 12 alerts
   - Phone number: +1 (555) 123-4567

**Long-term:**

- Document test account creation procedure
- Create automated seeding script
- Add to developer onboarding checklist

---

## Priority Justification

**Why HIGH severity:**

- Blocks all QA testing activities
- Cannot test documented scenarios
- Multiple test accounts affected
- No automated way to create accounts

**Why not CRITICAL:**

- Workaround exists (irving.forbush@ account)
- Development environment only
- Does not affect production

---

## Related Issues

- BUG-W6-002: Data mismatch between desktop and mobile URLs
- TEST-CREDENTIALS.md may need updating after accounts are created

---

## Action Items

- [ ] James: Verify test accounts exist in Supabase
- [ ] James: Create missing test accounts
- [ ] James: Seed test data for quinn.qa@
- [ ] James: Update TEST-CREDENTIALS.md if passwords need changing
- [ ] Quinn: Retest login after accounts created
- [ ] Quinn: Verify test data loaded correctly

---

**Assigned To:** James (Developer)
**Target Resolution:** Before Week 6 testing continues
**Blocking:** Week 6 cross-browser testing, edge case testing

---

## ✅ RESOLUTION (November 7, 2025)

**Fixed By:** James
**Resolution Time:** 15 minutes

**Actions Taken:**

1. Created script: `/scripts/create-test-accounts.ts`
2. Used Supabase Admin API to create all 3 test accounts
3. Auto-confirmed emails (no verification required)
4. All accounts ready for immediate use

**Test Accounts Created:**

- `quinn.qa@grailseeker.io` / `TestPass123!` (User ID: eb01ade0-3e18-49e9-8b3c-3e4b87c30f35)
- `quinn.empty@grailseeker.io` / `TestPass123!` (User ID: 19217a4c-400d-45a3-bafc-6dc397325a9e)
- `quinn.concurrent@grailseeker.io` / `TestPass123!` (User ID: 6eeecc80-25f1-4eae-a534-14c500a21542)

**Verification:**

- [ ] Quinn: Test login with quinn.qa@grailseeker.io
- [ ] Quinn: Verify empty state with quinn.empty@grailseeker.io
- [ ] Quinn: Test concurrent sessions with quinn.concurrent@grailseeker.io

**Note:** Test data for quinn.qa@ account (5 searches, 12 alerts) still needs to be seeded. For now, account works but will show empty state.
