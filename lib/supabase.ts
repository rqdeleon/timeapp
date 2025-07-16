import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  status: "active" | "inactive"
  hire_date: string
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  employee_id: string
  date: string
  shift_type: "morning" | "evening" | "night"
  start_time: string
  end_time: string
  status: "pending" | "confirmed" | "completed" | "no-show"
  checked_in_at?: string
  checked_out_at?: string
  is_late: boolean
  late_minutes?: number
  breaks_taken: number
  total_breaks: number
  location: string
  created_at: string
  updated_at: string
  employee?: Employee
}

export interface Department {
  id: string
  name: string
  created_at: string
}

export interface Position {
  id: string
  name: string
  department_id: string
  created_at: string
}
