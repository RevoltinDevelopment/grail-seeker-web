# Test Credentials & Test Data
**For:** Quinn (QA - Week 6 Testing)
**Last Updated:** November 6, 2025
**Environment:** Local Development

---

## 🔐 Test Accounts

### Primary Test Account (Use this for most testing)
```
Email: quinn.qa@grailseeker.io
Password: TestPass123!
Status: Active
Has Data: Yes (5 searches, 12 alerts)
```

**What's pre-loaded:**
- 5 saved searches (mix of active/paused)
- 12 alerts (mix of direct matches and near misses)
- Phone number: +1 (555) 123-4567
- SMS notifications: Enabled
- Account created: Nov 1, 2025

### Secondary Test Account (For testing empty states)
```
Email: quinn.empty@grailseeker.io
Password: TestPass123!
Status: Active
Has Data: No (brand new user)
```

**What's pre-loaded:**
- 0 searches
- 0 alerts
- Use this to test empty state UI

### Test Account 3 (For concurrent session testing)
```
Email: quinn.concurrent@grailseeker.io
Password: TestPass123!
Status: Active
Has Data: Yes (2 searches, 3 alerts)
```

**Use for:**
- Testing simultaneous edits
- Session timeout scenarios
- Multi-tab behavior

---

## 📝 How to Create Your Own Test Account

If you need additional accounts:

1. Go to http://localhost:3001/register
2. Fill out registration form:
   - Email: `your-name@test.com`
   - Password: `TestPass123!` (minimum 8 chars)
3. Check email for confirmation link (Supabase will send)
4. Click confirmation link
5. Login

**Note:** Email confirmation is required. Check your inbox/spam.

---

## 🧪 Test Data Reference

### Pre-Loaded Searches (quinn.qa@grailseeker.io)

**Search 1: Amazing Spider-Man #1**
- Series: Amazing Spider-Man (1963)
- Issue: 1
- Grade Range: 6.0 - 8.0
- Page Quality: Any
- Grading Authority: CGC
- Max Price: $50,000
- Status: Active
- Platform: eBay

**Search 2: X-Men #1**
- Series: X-Men (1963)
- Issue: 1
- Grade Range: Any (0.5 - 10.0)
- Page Quality: White
- Grading Authority: Any
- Max Price: None (any price)
- Status: Active
- Platform: eBay

**Search 3: Batman #1**
- Series: Batman (1940)
- Issue: 1
- Grade Range: 4.0 - 6.0
- Page Quality: Cream to Off-White
- Grading Authority: CBCS
- Max Price: $100,000
- Status: Paused
- Platform: eBay

**Search 4: Detective Comics #27**
- Series: Detective Comics (1937)
- Issue: 27
- Grade Range: 1.0 - 3.0
- Page Quality: Any
- Grading Authority: Any
- Max Price: $250,000
- Status: Active
- Platform: eBay

**Search 5: Action Comics #1**
- Series: Action Comics (1938)
- Issue: 1
- Grade Range: 0.5 - 2.0
- Page Quality: Any
- Grading Authority: CGC
- Max Price: $500,000
- Status: Paused
- Platform: eBay

### Pre-Loaded Alerts (quinn.qa@grailseeker.io)

**Alert 1: Direct Match 🎯**
- Search: X-Men #1
- Title: "X-Men #1 CGC 8.5 White Pages Marvel 1963"
- Price: $45,000
- Grade: 8.5
- Match Type: Direct Match
- Platform: eBay
- Created: Nov 5, 2025

**Alert 2: Near Miss 💎 (Grade)**
- Search: Batman #1
- Title: "Batman #1 CGC 3.5 Cream Pages DC 1940"
- Price: $75,000
- Grade: 3.5 (search wants 4.0-6.0)
- Match Type: Near Miss
- Near Miss Reason: Grade
- Platform: eBay
- Created: Nov 4, 2025

**Alert 3: Near Miss 💎 (Price)**
- Search: Amazing Spider-Man #1
- Title: "Amazing Spider-Man #1 CGC 7.0 Off-White Pages Marvel 1963"
- Price: $55,000 (search max: $50,000)
- Grade: 7.0
- Match Type: Near Miss
- Near Miss Reason: Price
- Platform: eBay
- Created: Nov 4, 2025

*...and 9 more alerts (mix of direct matches and near misses)*

---

## 🎨 Comic Series for Autocomplete Testing

When creating new test searches, use these series (they exist in the database):

**Popular Series (Fast Autocomplete):**
- Amazing Spider-Man (1963)
- X-Men (1963)
- Fantastic Four (1961)
- Avengers (1963)
- Batman (1940)
- Detective Comics (1937)
- Action Comics (1938)
- Superman (1939)

**Edge Case Series (Test Special Characters):**
- G.I. Joe: A Real American Hero (1982) - periods and colon
- Uncanny X-Men (1981) - common prefix
- Spider-Man 2099 (1992) - hyphen and numbers

**Similar Names (Test Autocomplete Disambiguation):**
- Spider-Man (multiple series)
- X-Men (multiple series)
- Batman (multiple series)

---

## 🔢 Test Values for Forms

### Grade Range Testing
```
Valid Ranges:
- 0.5 - 10.0 (full range)
- 6.0 - 8.0 (standard range)
- 9.0 - 9.8 (high grade range)
- Any - Any (any grade)

Edge Cases:
- 10.0 - 0.5 (min > max - should auto-correct)
- 0.5 - 0.5 (same value - valid)
- Any - 8.0 (any min, specific max)
- 6.0 - Any (specific min, any max)
```

### Price Testing
```
Valid Prices:
- $100
- $5,000
- $50,000
- $250,000
- $1,000,000

Edge Cases:
- $0 (zero - should be valid)
- $999999999 (very large - should be valid)
- -$500 (negative - should reject)
- $abc (non-numeric - should reject)
- Empty (any price - valid)
```

### Issue Number Testing
```
Valid Issue Numbers:
- 1
- 129
- 350
- nn (no number)

Edge Cases:
- 0 (zero - should be valid)
- 99999 (very large - should be valid)
- -1 (negative - should reject)
- abc (letters - should reject except "nn")
- 1.5 (decimal - should reject)
```

### Email Testing (Registration/Login)
```
Valid Emails:
- test@example.com
- user.name@example.com
- user+tag@example.co.uk

Invalid Emails:
- test@example (no TLD)
- @example.com (no local part)
- test@.com (no domain)
- test example@test.com (space)
- test@example..com (double dot)
```

### Password Testing (Registration/Reset)
```
Valid Passwords:
- TestPass123! (8+ chars, mixed case, number, special)
- MySecurePassword2025 (long, mixed case, number)
- P@ssw0rd! (8 chars, all requirements)

Invalid Passwords:
- short (< 8 chars - should reject)
- alllowercase (no uppercase/number - may reject depending on rules)
- 12345678 (no letters - may reject)
```

---

## 🌐 Test URLs

### Frontend Pages (All require login except auth pages)
```
Authentication:
http://localhost:3001/login
http://localhost:3001/register
http://localhost:3001/forgot-password
http://localhost:3001/reset-password

Authenticated:
http://localhost:3001/dashboard
http://localhost:3001/searches
http://localhost:3001/searches/new
http://localhost:3001/searches/[id]/edit
http://localhost:3001/alerts
http://localhost:3001/settings
```

### Backend API Endpoints (For debugging)
```
Health Check:
http://localhost:3000/health/liveness

API (requires auth token):
http://localhost:3000/api/searches
http://localhost:3000/api/searches/:id
http://localhost:3000/api/alerts
http://localhost:3000/api/series/search?q=spider
```

---

## 🚨 Troubleshooting

### Can't Login with Test Credentials

**Error: "Invalid login credentials"**
- Verify email exactly matches: `quinn.qa@grailseeker.io`
- Verify password exactly matches: `TestPass123!`
- Check caps lock is off
- Try copy/paste from this document

**Error: "Email not confirmed"**
- Check email inbox for confirmation link
- Click confirmation link
- Try login again

**Still can't login:**
- Ask James to verify account exists in Supabase
- Ask James to manually confirm email

### No Test Data Showing Up

**Searches page is empty:**
- Verify you're logged in with `quinn.qa@grailseeker.io` (not the empty account)
- Check browser console for errors (F12)
- Verify backend server is running: http://localhost:3000/health/liveness
- Ask James to verify test data exists

**Alerts page is empty:**
- Same troubleshooting as searches
- Note: The "empty" test account intentionally has no data

### Backend Server Issues

**Error: "Network Error" or "Failed to fetch"**
- Verify backend is running: http://localhost:3000/health/liveness
- If not responding, ask James to restart backend server
- Known issue: Backend occasionally hangs (not your fault)

**Error: "401 Unauthorized"**
- Your session expired, logout and login again
- Clear browser cookies and try again

---

## 📞 Need More Test Data?

If you need specific test scenarios not covered here:

1. Create them yourself using the UI (good testing!)
2. Ask James to seed additional data
3. Document what you created for future testers

**Example:** If you need to test a search with all "Any" fields:
1. Login to `quinn.qa@grailseeker.io`
2. Create new search with all fields set to "Any"
3. Document it in your test notes

---

## 🔒 Security Note

**These are test credentials for local development only.**
- Do NOT use these passwords for anything else
- Do NOT commit credentials to git (this file is already gitignored)
- Do NOT share outside the team
- Production will use different credentials

---

**Questions?** Ask James (Developer) or check the main testing guide.
