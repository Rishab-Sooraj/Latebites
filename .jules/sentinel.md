## 2025-02-12 - Critical IDOR in Admin Info Lookup
**Vulnerability:** The `/api/admin/get-admin-info` endpoint allowed unauthenticated users to look up any user's name and email by ID. It bypassed RLS by using the service role key to query `auth.users` directly without verifying if the target user was actually an admin or if the requester was authorized.
**Learning:** Using `SUPABASE_SERVICE_ROLE_KEY` to "bypass RLS" for one purpose (e.g., looking up admin names) can inadvertently open up access to the entire `auth.users` table if input validation and authorization checks are missing.
**Prevention:** Always authenticate the requester first. When using service role keys, strictly validate the input and ensure the target resource is one that the requester is allowed to access (e.g., only return info if the ID exists in a public `admins` table).

## 2025-02-12 - Order Spoofing & Information Disclosure
**Vulnerability:** The `/api/orders/[id]` and `/api/orders/create` endpoints were completely unauthenticated. `/orders/[id]` allowed anyone to fetch full order details (PII) by ID. `/orders/create` allowed creating orders on behalf of any user ID passed in the request body.
**Learning:** API routes in Next.js do not inherit any default authentication. "Service Role" clients bypass RLS and must NEVER be used without first establishing the identity of the requester and validating that they have permission to perform the action or access the data.
**Prevention:**
1. Always use `createClient()` from `@/lib/supabase/server` to get the authenticated user session.
2. Check `if (!user) return 401`.
3. When creating resources, use `user.id` from the session, NOT from the request body.
4. When reading resources, verify `resource.user_id === user.id`.

## 2025-02-12 - Supabase Auth & Frontend Error Handling
**Vulnerability:** A "Database error saving new user" was exposed to users during signup when an account existed in `auth.users` but not in the application's `customers` table (a "zombie user"). This generic error confused users and potentially hinted at backend state inconsistencies.
**Learning:** Relying solely on a secondary table (like `customers`) to check for user existence is a performance optimization but can lead to false negatives if the tables are out of sync. Direct `auth.admin.listUsers()` checks are paginated and slow.
**Prevention:**
1. Use the `customers` table for the fast path (checking existence).
2. In the frontend, catch specific signup errors like "User already registered" and "Database error saving new user" (which often masks a unique constraint violation in Auth).
3. Gracefully redirect these cases to the login flow with a helpful message, rather than showing a raw database error.

## 2025-02-09 - Supabase Auth & Zombie Users
**Vulnerability:** Not a direct vulnerability, but a UX failure leading to user lock-out. Users existing in `auth.users` but missing from `public.customers` (zombie users) were unable to sign up because `check-email` only checked `customers`, allowing them to proceed to `signUp`, which then failed with a generic "Database error saving new user".
**Learning:** Supabase Auth operations can trigger database constraints (via triggers) that return generic "Database error" messages to the client, masking the true cause (duplicate user/key). Frontend error handling must be robust enough to interpret these generic errors as potential duplicate user scenarios.
**Prevention:**
1. Always check both Auth and App tables for user existence if possible (though Auth check is limited).
2. Implement robust error parsing in the frontend to catch "database error", "duplicate key", etc., and guide the user to Login.
3. Ensure the application can self-heal by creating missing profiles on login (which this app does via `AuthContext`).
