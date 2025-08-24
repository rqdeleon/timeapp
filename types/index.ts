export type Schedule = {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "checked-in" | "completed" | "no-show";
  location: string | null;
  shift_type_id: string;
  timezone: string;

  employee?: Employee | null;
  shift_type?: ShiftType | null;
  conflicts?: ScheduleConflict[];
  attendance_logs?: AttendanceLog[] | null;
};

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  until?: string;
  byWeekday?: number[];
}

export interface ScheduleConflict {
  type: 'overlap' | 'double_booking' | 'overtime_violation';
  conflicting_schedule: Schedule;
  message: string;
  severity: 'warning' | 'error';
}

export interface AttendanceConflict {
  type: 'overlap' | 'double_booking' | 'overtime_violation';
  conflicting_attendance: AttendanceLog;
  message: string;
  severity: 'warning' | 'error';
}

export type ShiftType = {
  id: string;
  name: string;
  is_operational: boolean;
  default_start_time: string;
  default_end_time: string;
  description: string;
};

export type AttendanceLog = {
  id: string;
  employee_id: string;
  date: string;
  schedule_id?: string;
  check_in_time: string;
  check_out_time?: string;
  overtime_approved?: number;
  overtime_raw?: number;
  approval_status?: 'approved' | 'rejected' | 'pending'
  notes?: string;
};

export type AttendanceFilters = {
  dateRange: { from: Date; to: Date };
  departments: string[];
  employees: string[];
  status: string[];
}

export type AttendanceSummary = {
  total_days_worked: number;
  total_hours_worked: number;
  total_overtime_hours: number;
  total_approved_overtime: number;
  total_sunday_hours: number;
  total_overnight_hours: number;
  date_range: {
    start: string;
    end: string;
  };
}

export type Department = {
  id: string;
  name: string;
  description: string;
}

export type UploadResult = {
  success: boolean;
  message: string;
  recordsProcessed?: number;
  errors?: string[];
};

export type EmployeeTimeLogs = {
  employeeId: string;
  employeeName: string;
  date: string;
  day: string;
  timeIn?: string;
  timeOut?: string;
}

export type EmployeeTimeRecord = {
  startDate: string;
  endDate: string;
  logs: EmployeeTimeLogs;
};

// types/employee.ts - Enhanced employee types
export type EmployeeStatus = 'active' | 'inactive' | 'terminated' | 'on_leave';

export type Employee = {
  id: string;
  employee_id?: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  department_id?: string;
  salary?: number;
  hire_date?: string;
  birth_date?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  status?: EmployeeStatus;
  avatar_url?: string;
  user_id?: string;
  manager_id?: string;
  created_at: string;
  updated_at: string;
  department?: Department;
  manager?: Employee;
  reports?: Employee[];
  sss_id?: string;
  tin_id?: string;
  pagibig_id?: string;
  hmo_id?: string;
  philhealth_id?: string;
};

export type EmployeeFormData = Omit<Employee, 'created_at' | 'updated_at' | 'department_id' | 'manager' | 'reports'>;

export type EmployeeColumnProps = {
  id: string;
  employee_id?: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  salary?: number;
  hire_date?: string;
  status?: EmployeeStatus;
  avatar_url?: string;
};

export type Notifications = {
  id: string;
  title: string;
  message: string;
  type: string;
  read_by?: string;
  deleted_by?: string;
  send_email?: boolean;
}