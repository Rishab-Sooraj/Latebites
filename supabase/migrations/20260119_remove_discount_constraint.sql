-- Remove the valid_discount constraint that blocks dynamic pricing
-- This allows restaurants to set any discount percentage

-- Drop the constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_discount' 
        AND conrelid = 'rescue_bags'::regclass
    ) THEN
        ALTER TABLE rescue_bags DROP CONSTRAINT valid_discount;
        RAISE NOTICE 'Dropped valid_discount constraint';
    ELSE
        RAISE NOTICE 'valid_discount constraint does not exist';
    END IF;
END $$;
