import { Employee, Department } from ".";
// types/attendance.ts
export type AttendanceStatus = 'active' | 'incomplete' | 'approved' | 'rejected';

export type AttendanceLog = {
  id: string;
  employee_id: string;
  employeeName?: string;
  department_id?: string;
  date: string;
  schedule_id?: string;
  check_in_time: string;
  check_out_time?: string;
  total_hours: number;
  raw_ot_hours?: number;
  approved_ot_hours?: number;
  is_sunday: boolean;
  is_overnight: boolean;
  overnight_hours?: number;
  vacation_flag?: boolean;
  uploaded_file_id?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  status: AttendanceStatus;
  machine_id?: string;
  notes?: string;
  employee?: Employee;
  department?: Department;
  approval_status?: 'approved' | 'rejected' | 'pending'
};

export type AttendanceColumnProps = {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  date: string;
  check_in_time: string;
  check_out_time?: string;
  total_hours: number;
  raw_ot_hours: number;
  approved_ot_hours?: number;
  is_sunday: boolean;
  is_overnight: boolean;
  overnight_hours: number;
  status: AttendanceStatus;
  notes?: string;
};

export type AttendanceSummary = {
  total_days_worked: number;
  total_hours_worked: number;
  total_overtime_hours: number;
  total_approved_overtime: number;
  total_sunday_hours: number;
  total_overnight_hours: number;
  total_employees: number;
};

export type UploadFile = {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  records_count: number;
  processed_count: number;
  error_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploaded_by: string;
  uploaded_at: string;
  processed_at?: string;
  errors?: any[];
  metadata?: any;
};

export type AttendanceFilters = {
  dateRange: { from: Date; to: Date };
  departments?: string[];
  employees?: string[];
  status?: AttendanceStatus[];
};

export type ParsedAttendanceRow = {
  employee_id: string;
  date: string;
  check_in_time: string;
  check_out_time?: string;
  machine_id?: string;
  notes?: string;
  rowIndex: number;
  isValid: boolean;
  errors: string[];
};