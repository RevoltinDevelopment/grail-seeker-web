# Deployment Guide
## Grail Seeker Frontend - Production Deployment

**Version:** 1.0
**Last Updated:** November 11, 2025
**Target Platform:** Vercel

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Vercel Setup](#vercel-setup)
3. [Environment Variables](#environment-variables)
4. [Sentry Setup](#sentry-setup)
5. [Deploy to Production](#deploy-to-production)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedure](#rollback-procedure)
8. [Monitoring & Alerts](#monitoring--alerts)

---

## Pre-Deployment Checklist

Before deploying to production, ensure all these items are complete:

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Linting passed (`npm run lint`)
- [ ] Type-check passed (`npm run type-check`)
- [ ] Build successful (`npm run build`)
- [ ] Code formatted (`npm run format`)

### Features
- [ ] All Phase 5.1 features complete (see PROJECT-STATUS.md)
- [ ] Error boundaries tested
- [ ] Authentication flows working
- [ ] Search creation/editing working
- [ ] Alert list working
- [ ] Settings page working
- [ ] Mobile responsive (375px, 768px, 1024px+)

### Infrastructure
- [ ] Backend API deployed and running
- [ ] Supabase database configured
- [ ] Twilio SMS configured (optional for beta)
- [ ] Domain names purchased (app.grailseeker.io)
- [ ] SSL certificates configured (automatic with Vercel)

---

## Vercel Setup

### Step 1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with GitHub account
3. Grant Vercel access to your GitHub organization

### Step 2: Import Project

```bash
# 1. Push your code to GitHub (if not already done)
git push origin main

# 2. Go to Vercel Dashboard
# https://vercel.com/dashboard

# 3. Click "Add New" → "Project"

# 4. Import grail-seeker-web repository

# 5. Configure Project Settings:
```

**Framework Preset:** Next.js
**Root Directory:** `./` (leave as is)
**Build Command:** `npm run build`
**Output Directory:** `.next` (auto-detected)
**Install Command:** `npm install`

### Step 3: Configure Custom Domain

```bash
# In Vercel Dashboard → Project Settings → Domains

# Add custom domain:
app.grailseeker.io

# Follow Vercel's instructions to:
# 1. Add DNS records to your domain registrar
# 2. Verify domain ownership
# 3. Wait for SSL certificate generation (automatic)
```

**DNS Configuration:**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: 3600
```

---

## Environment Variables

### Step 1: Set Production Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://twitplasyaijgnvkylfm.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[Your Supabase Anon Key]` | Production |
| `NEXT_PUBLIC_API_URL` | `https://api.grailseeker.io` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://app.grailseeker.io` | Production |
| `NEXT_PUBLIC_SENTRY_DSN` | `[Your Sentry DSN]` | Production |
| `SENTRY_AUTH_TOKEN` | `[Your Sentry Auth Token]` | Production |
| `SENTRY_ORG` | `grail-seeker` | Production |
| `SENTRY_PROJECT` | `grail-seeker-web` | Production |

**⚠️ IMPORTANT:**
- Use "Production" environment for these variables
- Also add to "Preview" environment for testing PR deployments
- Never commit these values to Git

### Step 2: Verify Environment Variables

After setting variables, redeploy the project to apply changes:

```bash
# In Vercel Dashboard
Deployments → Latest Deployment → Redeploy
```

---

## Sentry Setup

### Step 1: Create Sentry Project

1. Go to https://sentry.io/signup
2. Create new organization: `grail-seeker`
3. Create new project:
   - **Platform:** Next.js
   - **Project Name:** `grail-seeker-web`
   - **Alert Frequency:** On every new issue

### Step 2: Get Sentry Credentials

```bash
# Navigate to Sentry Dashboard
# Settings → Projects → grail-seeker-web → Client Keys (DSN)

# Copy the DSN (looks like):
https://[key]@[org].ingest.sentry.io/[project-id]

# Navigate to Settings → Developer Settings → Auth Tokens
# Create new token with scopes:
# - project:releases
# - org:read

# Copy the auth token
```

### Step 3: Configure Sentry in Vercel

Add Sentry environment variables to Vercel (see [Environment Variables](#environment-variables) section above).

### Step 4: Test Sentry Integration

After deployment, trigger a test error:

```typescript
// In browser console on production site
throw new Error('Sentry test error')

// Check Sentry Dashboard → Issues
// You should see the error appear within 1 minute
```

---

## Deploy to Production

### Option 1: Automatic Deployment (Recommended)

Vercel automatically deploys on every push to `main` branch:

```bash
# 1. Ensure all changes are committed
git add .
git commit -m "feat: deployment prep - add Sentry and error boundaries"

# 2. Push to main branch
git push origin main

# 3. Vercel will automatically:
#    - Detect the push
#    - Run build
#    - Deploy to production
#    - Update DNS

# 4. Check deployment status
# https://vercel.com/dashboard → Deployments
```

### Option 2: Manual Deployment

Using Vercel CLI:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod

# 4. Follow prompts
```

### Deployment Timeline

- **Build time:** ~2-3 minutes
- **DNS propagation:** ~5-10 minutes
- **SSL certificate:** Automatic (Vercel handles this)
- **Total time to live:** ~10-15 minutes

---

## Post-Deployment Verification

### Automated Checks

```bash
# 1. Check deployment status
curl https://app.grailseeker.io

# 2. Check health endpoint (if exists)
curl https://app.grailseeker.io/api/health

# 3. Verify SSL certificate
curl -vI https://app.grailseeker.io 2>&1 | grep -i ssl
```

### Manual Testing Checklist

- [ ] **Landing Page**
  - [ ] Opens successfully
  - [ ] No console errors
  - [ ] All images load

- [ ] **Authentication**
  - [ ] Can register new account
  - [ ] Receive email confirmation
  - [ ] Can login
  - [ ] Can logout
  - [ ] Password reset flow works

- [ ] **Dashboard**
  - [ ] Loads after login
  - [ ] Stats cards display correctly
  - [ ] Recent alerts appear (if any)
  - [ ] Navigation works

- [ ] **Searches**
  - [ ] Can create search
  - [ ] Can edit search
  - [ ] Can delete search
  - [ ] Can pause/resume search

- [ ] **Alerts**
  - [ ] Alert list loads
  - [ ] Filtering works
  - [ ] Load More pagination works

- [ ] **Settings**
  - [ ] Can update account info
  - [ ] Can change password
  - [ ] Can update notification preferences

- [ ] **Error Boundaries**
  - [ ] Graceful error handling
  - [ ] Errors sent to Sentry

### Performance Checks

```bash
# Run Lighthouse audit
# 1. Open Chrome DevTools
# 2. Go to Lighthouse tab
# 3. Select "Desktop" or "Mobile"
# 4. Click "Generate report"

# Target scores:
# - Performance: 90+
# - Accessibility: 95+
# - Best Practices: 95+
# - SEO: 90+
```

### Sentry Verification

1. Go to Sentry Dashboard
2. Check for any deployment errors
3. Verify error tracking is working
4. Set up alert rules for critical errors

---

## Rollback Procedure

### If Deployment Fails

**Option 1: Instant Rollback (Vercel Dashboard)**

```bash
# 1. Go to Vercel Dashboard → Deployments
# 2. Find previous working deployment
# 3. Click "..." menu → "Promote to Production"
# 4. Confirm rollback
# → Takes effect immediately (30 seconds)
```

**Option 2: Git Revert**

```bash
# 1. Revert the problematic commit
git revert HEAD
git push origin main

# 2. Vercel will auto-deploy the reverted version
# → Takes 2-3 minutes (full build)
```

### If Critical Bug Found Post-Deployment

1. **Immediate Actions:**
   - Rollback to previous deployment (see above)
   - Post notice in team Slack
   - Update status page (if exists)

2. **Investigation:**
   - Check Sentry for error reports
   - Review Vercel deployment logs
   - Check user reports

3. **Fix & Redeploy:**
   - Create hotfix branch: `hotfix/critical-bug-name`
   - Fix the issue
   - Test locally
   - Merge to main
   - Verify deployment

---

## Monitoring & Alerts

### Vercel Analytics

**Built-in (Free):**
- Page load times
- Web Vitals (LCP, FID, CLS)
- Error rates
- Traffic patterns

**Access:** Vercel Dashboard → Analytics

### Sentry Monitoring

**Alert Rules (Recommended Setup):**

1. **Critical Errors**
   - Condition: New error affecting >10 users
   - Action: Email + Slack notification
   - Response: Immediate

2. **Performance Issues**
   - Condition: Page load >3s for >20% of users
   - Action: Email notification
   - Response: Within 24 hours

3. **API Failures**
   - Condition: API error rate >5%
   - Action: Email + Slack notification
   - Response: Within 1 hour

### Uptime Monitoring (Optional)

**Recommended Tool:** UptimeRobot (free tier)

```bash
# Setup:
# 1. Create account at uptimerobot.com
# 2. Add monitor:
#    - Type: HTTP(s)
#    - URL: https://app.grailseeker.io
#    - Interval: 5 minutes
# 3. Add alert contacts (email, Slack)
```

---

## Environment-Specific Configuration

### Production
- URL: `https://app.grailseeker.io`
- API: `https://api.grailseeker.io`
- Database: Supabase Production
- Error Tracking: Sentry (enabled)
- Console Logs: Removed (via next.config.js)
- Source Maps: Hidden (via Sentry config)

### Preview (PR Deployments)
- URL: Auto-generated by Vercel (`grail-seeker-web-*.vercel.app`)
- API: Staging API or Production (configurable)
- Database: Supabase Production (shared)
- Error Tracking: Sentry (enabled)
- Console Logs: Enabled
- Source Maps: Visible

### Development
- URL: `http://localhost:3001`
- API: `http://localhost:3000`
- Database: Supabase Production (shared)
- Error Tracking: Sentry (disabled)
- Console Logs: Enabled
- Source Maps: Visible

---

## Troubleshooting

### Build Fails on Vercel

**Problem:** Build errors in Vercel but works locally

**Solution:**
```bash
# 1. Clear Next.js cache locally
rm -rf .next

# 2. Test production build locally
npm run build

# 3. Check Vercel build logs
# Vercel Dashboard → Deployments → Failed Build → View Logs

# 4. Common issues:
# - Environment variables missing
# - TypeScript errors (strict mode)
# - Import paths incorrect
```

### 404 on Custom Domain

**Problem:** app.grailseeker.io returns 404

**Solution:**
```bash
# 1. Check DNS propagation
# https://www.whatsmydns.net/#CNAME/app.grailseeker.io

# 2. Verify CNAME record:
dig app.grailseeker.io CNAME

# 3. Check Vercel domain settings
# Vercel Dashboard → Settings → Domains

# 4. Re-verify domain if needed
```

### Sentry Not Receiving Errors

**Problem:** Errors not appearing in Sentry

**Solution:**
```bash
# 1. Check Sentry DSN is set in Vercel env vars
# 2. Verify NODE_ENV is 'production'
# 3. Test with manual error:
throw new Error('Sentry test error')

# 4. Check Sentry quotas (free tier limits)
# 5. Verify source maps uploaded:
# Vercel build logs should show "Uploading source maps to Sentry"
```

---

## Deployment Checklist (Summary)

**Pre-Deployment:**
- [ ] Code quality checks pass
- [ ] All features tested
- [ ] Backend API deployed

**Vercel Setup:**
- [ ] Project imported
- [ ] Custom domain configured
- [ ] Environment variables set

**Sentry Setup:**
- [ ] Project created
- [ ] DSN configured
- [ ] Alert rules set

**Deployment:**
- [ ] Push to main branch
- [ ] Monitor build progress
- [ ] Verify deployment success

**Post-Deployment:**
- [ ] Manual testing complete
- [ ] Performance checks pass
- [ ] Sentry receiving errors
- [ ] Monitoring active

**Documentation:**
- [ ] Update PROJECT-STATUS.md
- [ ] Update CHANGELOG.md
- [ ] Notify team in Slack

---

## Additional Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Sentry Next.js Guide:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Vercel CLI Reference:** https://vercel.com/docs/cli

---

**Questions?** Contact Winston (Architect) or check the PROJECT-STATUS.md file.

**Last Updated:** November 11, 2025
