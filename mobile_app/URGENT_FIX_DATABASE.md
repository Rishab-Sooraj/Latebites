# 🚨 URGENT: Fix Authentication Errors

## The Problem
You're seeing these errors because **the database tables don't exist yet**:
- ❌ `Could not find the table 'public.users'`
- ❌ Google Sign-In also failing

## The Solution (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `zwwbfjygtertvsvbaqze`
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Database Schema
1. Click **"New Query"**
2. Copy the ENTIRE contents of `database_schema.sql`
3. Paste into the SQL Editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)

**File location:** `/Users/rishabsooraj/orchids-projects/food-rescue-manifesto/mobile_app/database_schema.sql`

### Step 3: Add Sample Data (Optional but Recommended)
1. Click **"New Query"** again
2. Copy the ENTIRE contents of `sample_data.sql`
3. Paste and click **"Run"**

**File location:** `/Users/rishabsooraj/orchids-projects/food-rescue-manifesto/mobile_app/sample_data.sql`

### Step 4: Verify Tables Created
Run this query to check:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- ✅ users
- ✅ restaurants
- ✅ rescue_bags
- ✅ bookings
- ✅ feedback
- ✅ penalties

### Step 5: Try Signup Again
1. Go back to the app on your phone
2. Try signing up with email/password
3. Should work now! ✅

---

## What the Schema Creates

### Tables:
1. **users** - User accounts (customer/restaurant/admin)
2. **restaurants** - Restaurant profiles with location
3. **rescue_bags** - Available bags (S/M/L with prices)
4. **bookings** - Customer bookings with OTP
5. **feedback** - Post-pickup reviews
6. **penalties** - Admin penalties for restaurants

### Security:
- ✅ Row Level Security (RLS) enabled
- ✅ Customers can only see their bookings
- ✅ Restaurants can only manage their bags
- ✅ Public can view approved restaurants

### Features:
- ✅ Auto-generate 6-digit OTP
- ✅ Auto-decrement slots on booking
- ✅ Auto-update timestamps
- ✅ Indexes for performance

---

## After Running SQL

**Email/Password Signup will:**
1. Create user in `auth.users`
2. Create profile in `public.users`
3. Navigate to Customer Home
4. Show nearby restaurants! 🎉

**Sample Data includes:**
- 5 Coimbatore restaurants
- 12 rescue bags (today + tomorrow)
- Prices: ₹89 - ₹229
- Various sizes and pickup times

---

## Troubleshooting

**If you still get errors:**
1. Check Supabase SQL Editor for error messages
2. Make sure ALL SQL ran successfully
3. Verify tables exist with the query above
4. Restart the Flutter app (press `R` in terminal)

**Google Sign-In error:**
- This is separate - needs Google Cloud setup
- For now, use email/password signup
- We'll fix Google Sign-In later

---

**Run the SQL now, then try signup again!** 🚀
