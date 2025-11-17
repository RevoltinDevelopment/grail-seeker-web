# Sentry Setup Guide
## Error Tracking for Grail Seeker Frontend

**Status:** Step-by-step setup instructions
**Estimated Time:** 15 minutes
**Last Updated:** November 11, 2025

---

## Overview

Sentry provides real-time error tracking and monitoring for the Grail Seeker frontend. This guide walks you through:
1. Creating a Sentry account
2. Setting up your project
3. Getting credentials
4. Testing the integration

---

## Step 1: Create Sentry Account

### 1.1 Sign Up

1. Go to https://sentry.io/signup/
2. Choose **"Sign up with GitHub"** (recommended - easier integration)
   - OR use email/password
3. Verify your email address

### 1.2 Create Organization

After signing up, you'll be prompted to create an organization:

```
Organization Name: grail-seeker
Team Name: engineering (or leave default)
```

**Why this matters:** Organization groups all your projects (frontend, backend, mobile apps, etc.)

---

## Step 2: Create Project

### 2.1 Start Project Creation

1. Click **"Create Project"** button
2. Select platform: **Next.js**
3. Configure project:

```
Alert Frequency: On every new issue (recommended for beta)
Project Name: grail-seeker-web
Team: Default (or select your team)
```

4. Click **"Create Project"**

### 2.2 Skip the SDK Installation

You'll see installation instructions - **you can skip these** since we've already installed Sentry in the codebase.

Click **"Skip this onboarding"** or just close the guide.

---

## Step 3: Get Your DSN (Data Source Name)

### 3.1 Find Your DSN

1. In Sentry Dashboard, go to: **Settings → Projects → grail-seeker-web**
2. In the left sidebar, click **"Client Keys (DSN)"**
3. You'll see your DSN - it looks like this:

```
https://1234567890abcdef1234567890abcdef@o123456.ingest.sentry.io/1234567
```

**⚠️ Keep this private!** This is like a password for your Sentry project.

### 3.2 Copy Your DSN

Click the **"Copy"** button next to the DSN.

---

## Step 4: Create Auth Token (for Source Maps)

### 4.1 Navigate to Auth Tokens

1. In Sentry Dashboard, click your **profile icon** (top right)
2. Select **"User settings"**
3. In left sidebar, click **"Auth Tokens"**
4. Click **"Create New Token"**

### 4.2 Configure Token

```
Token name: Grail Seeker Web Deploy
Scopes (select these):
  ✓ project:read
  ✓ project:releases
  ✓ org:read
```

Click **"Create Token"**

### 4.3 Copy Auth Token

**⚠️ IMPORTANT:** Copy the token immediately - you can't view it again!

It looks like:
```
sntrys_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

---

## Step 5: Add Credentials to Your Environment

Now I'll help you add these credentials to your `.env.local` file.

**You need:**
1. ✅ Sentry DSN (from Step 3)
2. ✅ Sentry Auth Token (from Step 4)

**Provide these to James (the dev agent) and I'll add them to your environment file.**

---

## Step 6: Test Sentry Integration (After Setup)

Once credentials are added, we'll test the integration:

### 6.1 Start Development Server

```bash
cd /Users/mahanarcher/dev/grail-seeker-web
npm run dev
```

### 6.2 Trigger a Test Error

1. Open http://localhost:3001 in your browser
2. Open browser console (F12 or Cmd+Option+J)
3. Type and execute:

```javascript
throw new Error('Sentry test error - ignore this')
```

### 6.3 Verify in Sentry

1. Go to Sentry Dashboard → Issues
2. You should see the test error appear within 1-2 minutes
3. Click on the error to see details:
   - Error message
   - Stack trace
   - User browser info
   - Breadcrumbs (user actions before error)

**If you see the error in Sentry ✅ Integration working!**

---

## Step 7: Configure Alert Rules (Optional but Recommended)

### 7.1 Create Alert Rule

1. In Sentry Dashboard, go to **Alerts**
2. Click **"Create Alert"**
3. Select **"Issues"**

### 7.2 Configure Alert

**For Critical Errors:**
```
Alert name: Critical Frontend Errors
When: A new issue is created
If: None (fire on all errors)
Then: Send notification to [your email]
```

Click **"Save Rule"**

### 7.3 Add More Rules (Recommended)

**High Error Volume:**
```
Alert name: High Error Rate
When: An issue is seen more than 100 times in 1 hour
Then: Send notification to [your email]
```

**Performance Degradation:**
```
Alert name: Slow Page Load
When: A performance issue is seen
If: Duration is greater than 3000ms
Then: Send notification to [your email]
```

---

## Step 8: Team Collaboration (Optional)

### 8.1 Invite Team Members

1. Go to **Settings → Teams**
2. Click **"Invite Member"**
3. Enter email addresses:
   - Quinn (QA tester)
   - Winston (Architect)
   - Other developers

### 8.2 Set Permissions

For each team member:
- **Admin:** Full access (Winston)
- **Member:** View and comment (Quinn, other devs)
- **Billing:** Billing only (optional)

---

## Pricing & Limits

### Free Tier (Developer Plan)

**Includes:**
- 5,000 errors/month
- 10,000 performance units/month
- 1 GB of attachments
- 30 days of data retention
- Unlimited team members

**Good for:** Beta launch, early testing

### When to Upgrade

Upgrade to Team plan ($26/month) when:
- Hitting 5,000 errors/month consistently
- Need more than 30 days of data retention
- Want advanced features (custom dashboards, alerts)

**For Grail Seeker Beta:** Free tier should be sufficient.

---

## Sentry Dashboard Overview

### Key Sections

1. **Issues** - List of all errors
2. **Performance** - Page load times, API response times
3. **Releases** - Track which version has which errors
4. **Discover** - Custom queries and analytics
5. **Alerts** - Configure notifications

### What to Monitor

**Daily:**
- New issues (check email alerts)
- Error trends (are errors increasing?)

**Weekly:**
- Performance metrics
- Most common errors
- User impact (how many users affected?)

---

## Troubleshooting

### Problem: No errors appearing in Sentry

**Solutions:**
1. Verify DSN is correct in `.env.local`
2. Check `enabled: process.env.NODE_ENV === 'production'` in config
   - For local testing, temporarily set to `enabled: true`
3. Clear browser cache and reload
4. Check browser console for Sentry errors
5. Verify project isn't paused in Sentry settings

### Problem: Source maps not uploading

**Solutions:**
1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check `SENTRY_ORG` and `SENTRY_PROJECT` match exactly
3. Review Vercel build logs for upload errors
4. Ensure token has `project:releases` scope

### Problem: Too many errors

**Solutions:**
1. Use **Filters** to ignore known non-critical errors
2. Configure **Sampling** to only send % of errors
3. Add **beforeSend** filters to Sentry config
4. Check if it's a repeated error (fix the root cause!)

---

## Next Steps

After completing Sentry setup:

1. ✅ Add credentials to `.env.local`
2. ✅ Test integration locally
3. ✅ Add credentials to Vercel (for production)
4. ✅ Configure alert rules
5. ✅ Share access with team
6. 🚀 Deploy to production!

---

## Useful Links

- **Sentry Dashboard:** https://sentry.io/organizations/grail-seeker/
- **Next.js Documentation:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Manual Setup Guide:** https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
- **Performance Monitoring:** https://docs.sentry.io/product/performance/

---

**Questions?**
- Check Sentry docs: https://docs.sentry.io/
- Contact James (developer) for integration issues
- Contact Winston (architect) for account/billing questions

**Status:** Ready to set up! Go to Step 1 and start creating your account.

**Last Updated:** November 11, 2025
