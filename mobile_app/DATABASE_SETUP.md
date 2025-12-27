# Database Setup Guide

## 🗄️ Setting Up Supabase Database

Follow these steps to create all the necessary tables for LateBites.

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Schema

1. Open the file: `database_schema.sql`
2. Copy ALL the SQL code
3. Paste it into the Supabase SQL Editor
4. Click "Run" (or press Cmd/Ctrl + Enter)

### Step 3: Verify Tables Created

After running the SQL, you should see these 6 tables in your database:

1. ✅ **users** - User accounts (customer, restaurant, admin)
2. ✅ **restaurants** - Restaurant profiles
3. ✅ **rescue_bags** - Available rescue bags
4. ✅ **bookings** - Customer bookings with OTP
5. ✅ **feedback** - Post-pickup feedback
6. ✅ **penalties** - Restaurant penalties

### Step 4: Check in Table Editor

1. Go to "Table Editor" in Supabase
2. You should see all 6 tables listed
3. Click on each table to verify the columns

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with these policies:

### Users Table
- ✅ Users can view their own profile
- ✅ Users can update their own profile

### Restaurants Table
- ✅ Anyone can view approved restaurants
- ✅ Restaurant owners can manage their own restaurant

### Rescue Bags Table
- ✅ Anyone can view active bags with available slots
- ✅ Restaurant owners can manage their own bags

### Bookings Table
- ✅ Customers can view their own bookings
- ✅ Restaurants can view bookings for their bags
- ✅ Restaurants can update booking status (for OTP verification)

### Feedback Table
- ✅ Customers can create and view their own feedback
- ✅ Restaurants can view feedback for their restaurant

### Penalties Table
- ✅ Only admins can manage penalties

---

## 🔧 Automatic Features

The schema includes these automatic features:

### 1. Updated Timestamps
- All tables automatically update `updated_at` when modified

### 2. OTP Generation
- Function `generate_otp()` creates 6-digit OTPs

### 3. Slot Management
- When a booking is created, `available_slots` automatically decreases
- When slots reach 0, status changes to 'sold_out'

### 4. Performance Indexes
- Indexes on frequently queried columns for fast lookups

---

## 🧪 Testing the Database

### Test 1: Create a Test User

```sql
-- This happens automatically when someone signs up via the app
-- But you can manually insert for testing:

INSERT INTO users (id, email, full_name, role, auth_provider)
VALUES (
  'test-uuid-here',
  'test@example.com',
  'Test User',
  'customer',
  'email'
);
```

### Test 2: Create a Test Restaurant

```sql
INSERT INTO restaurants (user_id, name, address, city, closing_time, status)
VALUES (
  'test-uuid-here',
  'Test Bakery',
  '123 Main St',
  'Coimbatore',
  '21:00:00',
  'approved'
);
```

### Test 3: Create a Test Rescue Bag

```sql
INSERT INTO rescue_bags (
  restaurant_id,
  size,
  price,
  guaranteed_value,
  total_slots,
  available_slots,
  pickup_start,
  pickup_end
)
VALUES (
  'restaurant-uuid-here',
  'medium',
  99.00,
  300.00,
  10,
  10,
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '3 hours'
);
```

---

## 🚨 Important Notes

1. **User IDs**: The `users.id` must match the `auth.users.id` from Supabase Auth
2. **Timestamps**: All times are stored in UTC with timezone
3. **OTP Expiry**: OTPs are time-limited (set when booking is created)
4. **Cascading Deletes**: Deleting a user deletes all their related data
5. **Check Constraints**: Invalid data (e.g., negative slots) will be rejected

---

## 🔄 Updating the Schema

If you need to modify the schema later:

1. **Add a column**:
   ```sql
   ALTER TABLE restaurants ADD COLUMN phone TEXT;
   ```

2. **Modify a column**:
   ```sql
   ALTER TABLE restaurants ALTER COLUMN description TYPE VARCHAR(500);
   ```

3. **Add an index**:
   ```sql
   CREATE INDEX idx_restaurants_name ON restaurants(name);
   ```

---

## ✅ Verification Checklist

After running the schema, verify:

- [ ] All 6 tables exist
- [ ] RLS is enabled on all tables
- [ ] Triggers are created (check in Database → Triggers)
- [ ] Functions exist (check in Database → Functions)
- [ ] Indexes are created (check in Table Editor → Indexes)

---

## 🆘 Troubleshooting

**Error: "relation already exists"**
- Tables already created. Drop them first or skip creation.

**Error: "permission denied"**
- Make sure you're running as the database owner.

**RLS blocking queries**
- Check that you're authenticated when testing from the app.

---

**Database is ready! Now the app can:**
- ✅ Create user accounts
- ✅ Store restaurant profiles
- ✅ List rescue bags
- ✅ Handle bookings with OTP
- ✅ Collect feedback
- ✅ Track penalties
