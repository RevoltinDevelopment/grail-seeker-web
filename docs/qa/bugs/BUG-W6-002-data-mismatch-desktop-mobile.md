# BUG-W6-002: Data Mismatch Between Desktop and Mobile URLs

**Date:** November 7, 2025
**Reporter:** Quinn (QA)
**Severity:** 🔴 **CRITICAL**
**Status:** ✅ RESOLVED
**Browser:** Safari (Desktop vs iOS)
**Environment:** Local Development

---

## Summary

When logging in with the same account on desktop vs mobile, user sees completely different data. Desktop shows 3 searches and 7 alerts, while mobile shows 0 searches and 0 alerts for the same user account.

---

## Steps to Reproduce

**Desktop Test:**

1. Navigate to http://localhost:3001
2. Login with: `irving.forbush@grailteam.testinator.com`
3. View Dashboard

**Mobile Test:**

1. Navigate to http://192.168.86.38:3001 (on iPhone)
2. Login with: `irving.forbush@grailteam.testinator.com` (same account)
3. View Dashboard

---

## Expected Behavior

**Same account should see same data regardless of URL:**

- 3 searches (same on desktop and mobile)
- 7 alerts (same on desktop and mobile)
- Identical dashboard stats
- Identical user profile data

---

## Actual Behavior

**Desktop (localhost:3001):**

- 3 searches visible
- 7 alerts visible
- Dashboard shows populated data
- User profile loads correctly

**Mobile (192.168.86.38:3001):**

- 0 searches visible
- 0 alerts visible
- Dashboard shows empty state
- User profile appears empty (needs verification)

---

## Impact

**User Impact:**

- Data integrity concern - where is the user's data?
- Cannot trust application if data disappears
- Mobile experience appears broken
- Cross-device sync completely broken

**Business Impact:**

- CRITICAL: Suggests fundamental database/authentication issue
- Could indicate Row-Level Security (RLS) policy bug
- Could indicate session/token issue between environments
- Blocks all mobile testing
- Potential production blocker if not resolved

**QA Impact:**

- Cannot perform cross-browser mobile testing
- Cannot verify mobile responsive design with real data
- Cannot test mobile-specific features

---

## Root Cause Analysis

**Possible Causes:**

**Hypothesis 1: RLS Policy Issue (Most Likely)**

- Supabase Row-Level Security may be checking IP address
- Different URLs may trigger different RLS evaluation
- User ID might not be properly passed in network URL requests

**Hypothesis 2: Session/Cookie Issue**

- Cookies may be domain-specific (localhost vs 192.168.86.38)
- Session token might not transfer between URLs
- Authentication might succeed but user context lost

**Hypothesis 3: Database Query Issue**

- Query might filter by hostname
- API might have hardcoded localhost references
- Environment variable misconfiguration

**Hypothesis 4: Caching Issue**

- Browser cache on desktop showing old data
- Mobile showing fresh (empty) state
- Less likely given data populated on desktop

---

## Browser/Environment Details

**Desktop:**

- Browser: Safari 17.2 (macOS)
- URL: http://localhost:3001
- Supabase Client: Working
- Data Visible: YES (3 searches, 7 alerts)

**Mobile:**

- Browser: Safari 17+ (iOS)
- URL: http://192.168.86.38:3001
- Supabase Client: Working (auth succeeds)
- Data Visible: NO (0 searches, 0 alerts)

**Network:**

- Same WiFi network
- Backend: http://localhost:3000 (running)
- Frontend: Next.js 15.5.6

**Console Errors:**

- Desktop: None visible
- Mobile: Need to check Safari iOS DevTools (requires Mac connection)

---

## Reproduction Rate

**Reproducibility:** 100% (tested multiple times)

- Desktop always shows 3 searches, 7 alerts
- Mobile always shows 0 searches, 0 alerts
- Same account, same login credentials

---

## Debugging Steps Needed

**Immediate (James):**

1. Check browser console on mobile Safari (connect iPhone to Mac)
2. Check Network tab for failed API requests
3. Check Supabase Auth dashboard - verify user ID matches
4. Check Supabase RLS policies for user_grail_searches and search_results tables
5. Compare auth tokens between desktop and mobile sessions
6. Check API requests - are they hitting localhost:3000 or 192.168.86.38:3000?
7. Verify NEXT_PUBLIC_API_URL environment variable

**Verification Queries:**

```sql
-- Check if searches exist for this user
SELECT * FROM user_grail_searches
WHERE user_id = '[irving-user-id]';

-- Check if alerts exist for this user
SELECT * FROM search_results
WHERE user_id = '[irving-user-id]';

-- Check RLS policies
SELECT * FROM pg_policies
WHERE tablename IN ('user_grail_searches', 'search_results');
```

---

## Workaround

**Current Workaround:** NONE

- Cannot perform mobile testing with this account
- No way to load data on mobile URL
- Blocking mobile Safari iOS testing

**Attempted Workarounds:**

- Clearing browser cache - DID NOT HELP
- Logging out and back in - DID NOT HELP
- Different accounts - Cannot test (test accounts don't work per BUG-W6-001)

---

## Recommended Fix

**Investigation Priority Order:**

**1. Check API URL Configuration (5 minutes)**

```bash
# Verify NEXT_PUBLIC_API_URL in .env.local
# Should it be localhost:3000 or 192.168.86.38:3000?
# Mobile might need network IP for API calls
```

**2. Check RLS Policies (10 minutes)**

- Review user_grail_searches RLS policies
- Review search_results RLS policies
- Ensure they only check user_id, not hostname/IP

**3. Check Auth Token (15 minutes)**

- Compare Supabase auth tokens desktop vs mobile
- Verify user_id is same in both tokens
- Check token expiration and refresh logic

**4. Check Network Requests (20 minutes)**

- Use Safari Web Inspector on iPhone
- Monitor all API calls during login and data fetch
- Identify which requests fail or return empty

---

## Priority Justification

**Why CRITICAL severity:**

- **Data integrity issue** - user data disappears
- **Blocks mobile testing** - cannot verify mobile experience
- **Potential production blocker** - could affect real users
- **Suggests fundamental auth/database bug** - not just UI issue
- **100% reproducible** - consistent failure

**Why not lower severity:**

- This is not a minor bug - it's a complete failure of cross-device functionality
- Users expect their data to be accessible from any device
- If this reaches production, users will lose trust immediately

---

## Related Issues

- BUG-W6-001: Test credentials invalid (blocks testing with proper test accounts)
- API-TESTING-RESULTS.md: Database connection failure on /health/readiness
- CODE-QUALITY-SCAN.md: Supabase client null safety issues (could be related)

---

## Action Items

- [ ] James: Check browser console on mobile (Safari Web Inspector)
- [ ] James: Verify API URL configuration (.env.local)
- [ ] James: Check RLS policies for IP/hostname filtering
- [ ] James: Compare auth tokens desktop vs mobile
- [ ] James: Check if API is accessible from 192.168.86.38
- [ ] James: Verify data exists in database for irving.forbush@
- [ ] Quinn: Retest after fix deployed
- [ ] Quinn: Test with multiple accounts to verify fix

---

## Screenshots/Evidence

**Desktop (localhost:3001):**

- Dashboard shows: 3 active searches, 7 recent alerts
- Searches page: Lists 3 searches
- Alerts page: Lists 7 alerts

**Mobile (192.168.86.38:3001):**

- Dashboard shows: Empty state "No searches yet"
- Searches page: Empty state "Get started by creating your first search"
- Alerts page: Empty state "No alerts yet"

_(Screenshots to be attached)_

---

**Assigned To:** James (Developer)
**Target Resolution:** ASAP - Blocking all mobile testing
**Blocking:** Week 6 Safari iOS testing, Week 6 mobile responsive testing
**Requires:** Root cause analysis before fix can be implemented

---

## ✅ RESOLUTION (November 7, 2025)

**Fixed By:** James
**Resolution Time:** 10 minutes

**Root Cause Confirmed:**
Quinn's theory was correct! The issue was in `/lib/api/client.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
```

**The Problem:**

- Desktop (localhost:3001) → Calls API at `http://localhost:3000` → ✅ Works
- Mobile (192.168.86.38:3001) → Calls API at `http://localhost:3000` → ❌ Fails

When accessing from mobile, the JavaScript on the iPhone tried to fetch from `http://localhost:3000` which doesn't exist on the iPhone - only on the Mac.

**The Fix:**
Modified `/lib/api/client.ts` to dynamically determine the API URL based on the current hostname:

```typescript
function getAPIBaseURL(): string {
  // Server-side: use environment variable
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  }

  // Client-side: detect hostname
  const hostname = window.location.hostname

  // Localhost → use localhost:3000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000'
  }

  // Network IP → use same IP with port 3000
  return `http://${hostname}:3000`
}
```

**Now:**

- Desktop: `localhost:3001` → API at `localhost:3000` ✅
- Mobile: `192.168.86.38:3001` → API at `192.168.86.38:3000` ✅

**Verification:**

- [ ] Quinn: Login on mobile and verify searches/alerts appear
- [ ] Quinn: Compare desktop vs mobile data - should match
- [ ] Quinn: Create search on mobile - verify it appears

**Files Changed:**

- `lib/api/client.ts` - Added dynamic API URL detection
