-- Add new column shift_type_id to schedules table
ALTER TABLE schedules
ADD COLUMN shift_type_id UUID;

-- Update existing schedules to link to the new shift_types table
-- This assumes that the 'shift_type' column in 'schedules'
-- has values that match the 'name' column in 'shift_types'.
UPDATE schedules s
SET shift_type_id = st.id
FROM shift_types st
WHERE s.shift_type = st.name;

-- IMPORTANT: If any 'schedules.shift_type' values do not match 'shift_types.name',
-- their 'shift_type_id' will be NULL after the above UPDATE.
-- You might need to manually fix these or decide how to handle them.

-- Drop the old shift_type column
ALTER TABLE schedules
DROP COLUMN shift_type;

-- Add NOT NULL constraint to the new shift_type_id column
-- This step will fail if there are any NULL values in shift_type_id
-- (e.g., if some old shift_type values didn't match a shift_types.name)
ALTER TABLE schedules
ALTER COLUMN shift_type_id SET NOT NULL;
