-- Add salary column to the employees table
ALTER TABLE employees
ADD COLUMN salary DECIMAL(10, 2);

-- Optional: Set a default value for existing rows if needed
-- UPDATE employees SET salary = 0.00 WHERE salary IS NULL;
