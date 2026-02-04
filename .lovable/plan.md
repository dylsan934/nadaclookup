
# Admin Dashboard Implementation Plan

## Overview
Add a protected admin panel that allows you to view user statistics, see all users, and manage their accounts. The implementation will use secure server-side authorization via a backend function to prevent any client-side bypass attempts.

## Architecture

```text
+-------------------+       +----------------------+       +------------------+
|   Admin Page      |  -->  |  admin-dashboard     |  -->  |  user_roles      |
|   /admin          |       |  (Backend Function)  |       |  (Admin Check)   |
+-------------------+       +----------------------+       +------------------+
        |                            |
        v                            v
  Check isAdmin                Query profiles,
  (client-side UX)             auth.users, etc.
                               with service role
```

## Implementation Steps

### 1. Create Backend Function: `admin-dashboard`
A new secure backend function that:
- Verifies the requesting user is an admin (server-side check via `user_roles` table)
- Returns user statistics and user list using the service role key
- Supports actions like viewing subscription status per user

**Key statistics to include:**
- Total users
- New users (last 7 days, 30 days)
- Users with active subscriptions
- Total saved drugs across all users
- Total price alerts sent

### 2. Create Admin Page: `/admin`
A new page accessible only to admin users with:
- **Stats Dashboard**: Cards showing key metrics
- **User Table**: List of all users with:
  - Email
  - Sign-up date
  - Subscription status
  - Number of saved drugs
  - Last active date
- **Filters**: Search by email, filter by subscription status
- **Actions**: View user details (future: manage subscriptions)

### 3. Add Admin Route & Navigation
- Add `/admin` route in App.tsx
- Add admin link in Header (only visible when `isAdmin` is true)
- Redirect non-admins who try to access the page

## Security Measures
1. **Server-side authorization**: The backend function checks `user_roles` table before returning any data
2. **Service role access**: User emails and sensitive data are only accessed server-side
3. **Client-side guard**: The page redirects non-admins, but the real protection is the backend
4. **No email storage in public tables**: User emails are fetched via Supabase Auth admin API only

---

## Technical Details

### Backend Function Structure

```typescript
// supabase/functions/admin-dashboard/index.ts
// Endpoints:
// - GET /stats: Returns dashboard statistics
// - GET /users: Returns paginated user list with details
```

### Admin Page Components

```text
src/pages/Admin.tsx
├── Stats Cards (total users, subscriptions, etc.)
├── User Search/Filters
└── User Table
    ├── Email
    ├── Created Date
    ├── Subscription Status
    ├── Saved Drugs Count
    └── Actions (view details)
```

### Database Queries (via service role)

```sql
-- User stats with subscription status
SELECT 
  p.user_id,
  p.created_at,
  p.lifetime_saves_count,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id

-- Emails fetched separately from auth.users
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/admin-dashboard/index.ts` | Create | Secure API for admin data |
| `supabase/config.toml` | Modify | Add function config |
| `src/pages/Admin.tsx` | Create | Admin dashboard UI |
| `src/App.tsx` | Modify | Add `/admin` route |
| `src/components/Header.tsx` | Modify | Add admin nav link |

## Future Enhancements (not in this phase)
- User account suspension/deletion
- Subscription management (via Stripe)
- Activity logs
- Export user data to CSV
