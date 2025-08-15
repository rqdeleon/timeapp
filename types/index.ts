export type Schedule = {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed" | "no-show";
  location: string | null;
  shift_type_id: string;
  employee?: Employee | null;
  shift_type?: ShiftType | null;
  attendance_logs?: AttendanceLog[] | null;
};

export type Employee = {
  id: string;
  name: string;
  phone: string;
  position: string | null;
  email: string | null;
  avatar_url: string | null;
  salary: number | null;
  hire_date: string;
  status: string;
  user_id: string | null;
  department: Department;
};

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
  schedule_id: string;
  check_in_time: string;
  check_out_time?: string;
  notes?: string;
};

export type Department = {
  id: string;
  name: string;
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