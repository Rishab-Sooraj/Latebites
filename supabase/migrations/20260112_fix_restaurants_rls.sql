-- =====================================================
-- FIX RLS POLICIES FOR ADMIN OPERATIONS
-- =====================================================
-- This allows admins to create/update restaurants via service role

-- Allow service role to insert restaurants (used by admin portal)
CREATE POLICY "Service role can insert restaurants" ON restaurants
    FOR INSERT
    WITH CHECK (true);

-- Allow service role to update restaurants
CREATE POLICY "Service role can update restaurants" ON restaurants
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow anyone to read active verified restaurants
CREATE POLICY "Anyone can view active verified restaurants" ON restaurants
    FOR SELECT
    USING (is_active = true AND verified = true);

-- Allow restaurant owners to view their own restaurant
CREATE POLICY "Owners can view own restaurant" ON restaurants
    FOR SELECT
    USING (email = auth.jwt() ->> 'email');

-- Allow restaurant owners to update their own restaurant  
CREATE POLICY "Owners can update own restaurant" ON restaurants
    FOR UPDATE
    USING (email = auth.jwt() ->> 'email')
    WITH CHECK (email = auth.jwt() ->> 'email');
