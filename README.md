# Grail Seeker Web Application

## Frontend for Grail Seeker Comic Book Monitoring Platform

**Status:** Week 1 Complete - Foundation & Authentication ✅

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom design system
- **Authentication:** Supabase Auth (SSR package)
- **State Management:** React Query + Zustand (to be implemented)
- **Forms:** React Hook Form + Zod (to be implemented)

---

## Project Structure

```
grail-seeker-web/
├── app/
│   ├── (auth)/              # Unauthenticated routes
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (authenticated)/     # Protected routes
│   │   └── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   └── supabase/
│       ├── client.ts        # Client-side Supabase
│       └── server.ts        # Server-side Supabase
├── middleware.ts            # Auth route protection
└── tailwind.config.ts       # Sally's design system
```

---

## Design System (Sally's v1.1)

### Colors

- **Primary:** Collector Blue `#1E40AF`
- **Secondary:** Collector Navy `#1E293B`
- **Success:** Success Green `#059669`
- **Warning:** Warning Amber `#D97706`
- **Error:** Error Red `#DC2626`

### Typography

- **Font:** Inter (Google Fonts)
- **Scale:** h1 (36px), h2 (24px), h3 (18px), body (16px)
- **Mobile:** Reduced scale (h1: 28px, h2: 20px, h3: 16px)

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm
- Backend API running on `localhost:3000`

### Installation

```bash
cd /Users/mahanarcher/dev/grail-seeker-web
npm install
```

### Environment Variables

Already configured in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://twitplasyaijgnvkylfm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

Frontend runs on: **http://localhost:3001**

---

## Week 1 Deliverables ✅

### Completed

1. ✅ Next.js 14+ project initialized with TypeScript + Tailwind
2. ✅ Tailwind configured with Sally's custom colors (Collector Blue #1E40AF)
3. ✅ Supabase SSR client setup (client + server)
4. ✅ Auth middleware for route protection
5. ✅ Login page (`/login`)
6. ✅ Register page with phone number (`/register`)
7. ✅ Forgot Password page (`/forgot-password`)
8. ✅ Basic Dashboard page (`/dashboard`)
9. ✅ Server running on port 3001

### Auth Flow

```
Register → Email Verification → Login → Dashboard
Forgot Password → Email Reset Link → Login → Dashboard
```

---

## Testing Instructions

### 1. Test Home Page

Visit: http://localhost:3001

Expected: Landing page with "Stop Searching. Start Finding." + Login/Sign Up buttons

### 2. Test Registration

1. Visit: http://localhost:3001/register
2. Fill form:
   - Email: test@example.com
   - Password: password123 (min 8 chars)
   - Phone: +1 555-123-4567
   - Check "I agree to Terms"
3. Click "Sign Up"
4. Expected: Success message "Check Your Email"

### 3. Test Login

1. Check Supabase email for verification link (or use Supabase dashboard to verify manually)
2. Visit: http://localhost:3001/login
3. Enter credentials
4. Expected: Redirect to /dashboard

### 4. Test Protected Routes

1. Visit http://localhost:3001/dashboard without logging in
2. Expected: Redirect to /login
3. Log in, then visit /dashboard
4. Expected: Dashboard with "Recent Alerts" and "Active Searches"

### 5. Test Logout

1. From dashboard, click "Logout"
2. Expected: Redirect to /login
3. Try visiting /dashboard again
4. Expected: Redirect to /login (session cleared)

### 6. Test Forgot Password

1. Visit: http://localhost:3001/forgot-password
2. Enter email
3. Expected: Success message "Check Your Email"

---

## Next Steps (Week 2)

- [ ] Set up React Query provider
- [ ] Create API client layer
- [ ] Build Search List page
- [ ] Implement CRUD operations
- [ ] Test backend integration

---

## Architecture Notes

### Local Development Workflow

```
Terminal 1 (Backend):
cd ~/dev/grail-seeker
npm run dev  # → localhost:3000

Terminal 2 (Frontend):
cd ~/dev/grail-seeker-web
npm run dev  # → localhost:3001
```

### Auth Middleware

- `/dashboard`, `/searches`, `/alerts`, `/settings` → Protected (requires login)
- `/login`, `/register` → Public (redirect if authenticated)

### Supabase Integration

- **Client Components:** Use `createClient()` from `lib/supabase/client.ts`
- **Server Components:** Use `createClient()` from `lib/supabase/server.ts`
- **Middleware:** Refresh session on route change

---

## Known Issues

None currently! 🎉

---

## Developer Handoff References

- **UX Spec:** `/Users/mahanarcher/dev/grail-seeker/docs/ux/phase-5-design-specification.md`
- **Dev Handoff:** `/Users/mahanarcher/dev/grail-seeker/docs/architecture/phase-5-developer-handoff.md`
- **Backend Repo:** `/Users/mahanarcher/dev/grail-seeker`

---

**Week 1 Status:** ✅ COMPLETE
**Ready for Week 2:** Backend Integration
