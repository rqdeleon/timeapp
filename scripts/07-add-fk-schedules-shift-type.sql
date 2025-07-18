-- ✅ Run this AFTER 06-migrate-schedules-shift-type.sql

-- 1.  Make sure every schedule row has a valid shift_type_id.
--     If 06-migrate-… left NULLs you must correct them BEFORE adding the FK.
--     Example (replace ... with the correct UUID):
-- UPDATE schedules SET shift_type_id = '...' WHERE shift_type_id IS NULL;

-- 2.  Create an index (good for the many joins you’ll do).
CREATE INDEX IF NOT EXISTS idx_schedules_shift_type_id
ON schedules (shift_type_id);

-- 3.  Add the foreign-key constraint.
ALTER TABLE schedules
  ADD CONSTRAINT schedules_shift_type_id_fkey
    FOREIGN KEY (shift_type_id)
    REFERENCES shift_types (id)
    ON DELETE RESTRICT;   -- or CASCADE if you prefer
