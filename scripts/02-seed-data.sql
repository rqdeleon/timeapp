-- Insert sample departments
INSERT INTO departments (name) VALUES 
  ('Operations'),
  ('Sales'),
  ('Customer Service'),
  ('HR'),
  ('IT')
ON CONFLICT (name) DO NOTHING;

-- Insert sample positions
INSERT INTO positions (name, department_id) VALUES 
  ('Manager', (SELECT id FROM departments WHERE name = 'Operations')),
  ('Supervisor', (SELECT id FROM departments WHERE name = 'Operations')),
  ('Associate', (SELECT id FROM departments WHERE name = 'Operations')),
  ('Sales Manager', (SELECT id FROM departments WHERE name = 'Sales')),
  ('Sales Representative', (SELECT id FROM departments WHERE name = 'Sales')),
  ('Customer Service Manager', (SELECT id FROM departments WHERE name = 'Customer Service')),
  ('Customer Service Representative', (SELECT id FROM departments WHERE name = 'Customer Service')),
  ('HR Manager', (SELECT id FROM departments WHERE name = 'HR')),
  ('IT Manager', (SELECT id FROM departments WHERE name = 'IT')),
  ('Developer', (SELECT id FROM departments WHERE name = 'IT'));

-- Insert sample employees
INSERT INTO employees (name, email, phone, position, department, status, hire_date) VALUES 
  ('John Doe', 'john.doe@company.com', '(555) 123-4567', 'Manager', 'Operations', 'active', '2023-01-15'),
  ('Jane Smith', 'jane.smith@company.com', '(555) 234-5678', 'Supervisor', 'Sales', 'active', '2023-03-20'),
  ('Mike Johnson', 'mike.johnson@company.com', '(555) 345-6789', 'Associate', 'Operations', 'active', '2022-11-10'),
  ('Sarah Wilson', 'sarah.wilson@company.com', '(555) 456-7890', 'Customer Service Representative', 'Customer Service', 'active', '2023-05-08'),
  ('David Brown', 'david.brown@company.com', '(555) 567-8901', 'Associate', 'Operations', 'active', '2023-02-14'),
  ('Lisa Garcia', 'lisa.garcia@company.com', '(555) 678-9012', 'Customer Service Manager', 'Customer Service', 'active', '2022-09-01');

-- Insert sample schedules for today and upcoming days
INSERT INTO schedules (employee_id, date, shift_type, start_time, end_time, status, checked_in_at, is_late, late_minutes, breaks_taken, location) VALUES 
  ((SELECT id FROM employees WHERE email = 'john.doe@company.com'), CURRENT_DATE, 'morning', '09:00', '17:00', 'confirmed', CURRENT_DATE + TIME '08:55', false, 0, 1, 'Floor 1 - Operations'),
  ((SELECT id FROM employees WHERE email = 'jane.smith@company.com'), CURRENT_DATE, 'morning', '08:30', '16:30', 'confirmed', CURRENT_DATE + TIME '08:45', true, 15, 2, 'Floor 2 - Sales'),
  ((SELECT id FROM employees WHERE email = 'mike.johnson@company.com'), CURRENT_DATE, 'evening', '14:00', '22:00', 'pending', null, false, 0, 0, 'Floor 1 - Operations'),
  ((SELECT id FROM employees WHERE email = 'sarah.wilson@company.com'), CURRENT_DATE, 'morning', '09:00', '17:00', 'no-show', null, false, 0, 0, 'Floor 3 - Customer Service'),
  ((SELECT id FROM employees WHERE email = 'david.brown@company.com'), CURRENT_DATE, 'night', '22:00', '06:00', 'pending', null, false, 0, 0, 'Floor 1 - Operations'),
  ((SELECT id FROM employees WHERE email = 'lisa.garcia@company.com'), CURRENT_DATE - INTERVAL '1 day', 'evening', '13:00', '21:00', 'completed', CURRENT_DATE - INTERVAL '1 day' + TIME '12:58', false, 0, 2, 'Floor 3 - Customer Service');
