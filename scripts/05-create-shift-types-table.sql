-- Create a new table for managing shift types
CREATE TABLE IF NOT EXISTS shift_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  default_start_time TIME NOT NULL,
  default_end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for shift_types
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to have full access to shift_types
CREATE POLICY "Allow authenticated users full access to shift_types" ON shift_types
  FOR ALL TO authenticated USING (true);

-- Add trigger for updated_at column
CREATE TRIGGER update_shift_types_updated_at BEFORE UPDATE ON shift_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial shift types (if they don't exist)
INSERT INTO shift_types (name, default_start_time, default_end_time) VALUES
  ('morning', '09:00:00', '17:00:00'),
  ('evening', '14:00:00', '22:00:00'),
  ('night', '22:00:00', '06:00:00')
ON CONFLICT (name) DO NOTHING;
