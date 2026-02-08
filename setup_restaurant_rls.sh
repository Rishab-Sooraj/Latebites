#!/bin/bash

# Restaurant Orders RLS Policy Setup
# Run this to allow restaurants to view and update their own orders

echo "Setting up RLS policies for restaurant orders..."

# Read the SQL file
SQL_CONTENT=$(cat supabase/migrations/20260207_add_restaurant_orders_rls.sql)

echo "Please run the following SQL in your Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/zwwbfjygtertvsvbaqze/sql/new"
echo ""
echo "================================"
cat supabase/migrations/20260207_add_restaurant_orders_rls.sql
echo "================================"
echo ""
echo "After running the SQL, restart the Flutter app to see orders!"
