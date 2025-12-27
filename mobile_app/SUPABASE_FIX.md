# 🔧 URGENT: Fix Signup Errors

## Problem
Signup is failing with these errors:
1. **Google Sign-In**: PlatformException (not configured yet - can skip for now)
2. **Email/Password**: Supabase connection failed - **THIS IS THE MAIN ISSUE**

## Root Cause
Your `mobile_app/.env` file has placeholder Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co  ❌ PLACEHOLDER
SUPABASE_ANON_KEY=your-anon-key-here           ❌ PLACEHOLDER
```

## Solution (2 minutes)

### Step 1: Get Your Real Supabase Credentials

**Option A: From Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Settings" → "API"
4. Copy:
   - Project URL
   - anon/public key

**Option B: From Your Web Project**
1. Open: `/Users/rishabsooraj/orchids-projects/food-rescue-manifesto/.env.local`
2. Find these lines:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Copy those values

### Step 2: Update Mobile App .env File

1. **Open**: `mobile_app/.env`
2. **Replace** with your real values:
   ```
   SUPABASE_URL=https://your-actual-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
   ```

### Step 3: Restart the App

```bash
# In the terminal where the app is running:
# Press 'q' to quit

# Then run again:
cd /Users/rishabsooraj/orchids-projects/food-rescue-manifesto/mobile_app
export PATH="$PATH:$HOME/development/flutter/bin"
flutter run
```

## After This Fix

✅ Email/Password signup will work
✅ Login will work
✅ User accounts will be created in Supabase

## Next Steps (After .env is fixed)

I'll then add:
1. ✅ Location services (to find nearby restaurants)
2. ✅ Database setup (run the SQL schema)
3. ✅ Customer home screen (browse restaurants)

---

**Action Required:** Update the `.env` file with your real Supabase credentials, then restart the app!
