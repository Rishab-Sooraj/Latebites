# Supabase Setup Instructions

## Running the Migration

You have two options to set up your database:

### Option 1: Using Supabase Dashboard (Recommended for Quick Setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `migrations/001_customer_schema.sql`
4. Paste into the SQL editor
5. Click **Run** to execute

### Option 2: Using Supabase CLI (Recommended for Production)

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (you'll need your project ref from dashboard)
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Verifying the Setup

After running the migration, verify that the following tables exist:
- `customers`
- `customer_locations`
- `restaurants`
- `rescue_bags`
- `orders`
- `favorites`

You should also see sample data:
- 1 sample restaurant (The Kitchen Collective)
- 1 sample rescue bag

## Next Steps

1. Update your `.env.local` with Supabase credentials
2. Test the authentication flow
3. Start building the frontend components
