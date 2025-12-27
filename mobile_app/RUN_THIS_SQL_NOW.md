# 🚨 CRITICAL: Run This SQL to Fix Signup!

## The Problem
The `customers` table doesn't exist in your Supabase database yet, so signup is failing.

## The Solution (2 minutes)

### Option 1: Run Migration in Supabase Dashboard (EASIEST)

1. **Open Supabase SQL Editor:**
   - Direct link: https://supabase.com/dashboard/project/zwwbfjygtertvsvbaqze/sql/new

2. **Copy the SQL:**
   - Open this file: `supabase/migrations/001_customer_schema.sql`
   - Select ALL (Cmd+A)
   - Copy (Cmd+C)

3. **Paste and Run:**
   - Paste into Supabase SQL Editor
   - Click **"Run"** (or Cmd+Enter)
   - Wait for "Success" message

4. **Test Signup:**
   - Go back to your phone
   - Try signup again
   - Should work! ✅

---

### Option 2: Use Supabase CLI (if you have it installed)

```bash
cd /Users/rishabsooraj/orchids-projects/food-rescue-manifesto
supabase db push
```

---

## What This Creates

The migration creates these tables:
- ✅ `customers` - User profiles (shared with website!)
- ✅ `customer_locations` - Saved addresses
- ✅ `restaurants` - Restaurant profiles
- ✅ `rescue_bags` - Available rescue bags
- ✅ `orders` - Customer bookings
- ✅ `favorites` - Favorited restaurants

Plus:
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Sample restaurant data

---

## After Running SQL

**Signup will work!**
- Email/Password signup ✅
- Creates customer profile ✅
- Shared with website ✅
- Navigate to customer home ✅

---

## Verify It Worked

Run this query in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'customers';
```

Should return: `customers`

---

**Please run the SQL now so signup works!** 🙏

The file is here:
`/Users/rishabsooraj/orchids-projects/food-rescue-manifesto/supabase/migrations/001_customer_schema.sql`
