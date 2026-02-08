-- Remove admin accounts from customers table
-- This script removes any customer records that have admin emails

DELETE FROM customers 
WHERE email LIKE '%@latebites.in' 
   OR email IN (
       SELECT email FROM admins
   );

-- Or if you want to be more specific, just remove the specific admin:
-- DELETE FROM customers WHERE email = 'admin@latebites.in';
