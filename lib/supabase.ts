import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Type Definitions for Supabase Tables
export type Employee = {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  address: string | null
  position: string | null
  department: string | null
  hire_date: string | null
  status: "active" | "inactive" | "on_leave"
  salary: number | null
  avatar_url: string | null
}

export type ShiftType = {
  id: string
  created_at: string
  name: string
  default_start_time: string
  default_end_time: string
  description: string | null
}

export type Schedule = {
  id: string
  created_at: string
  employee_id: string
  date: string // YYYY-MM-DD format
  shift_type_id: string
  start_time: string // HH:MM:SS format
  end_time: string // HH:MM:SS format
  status: "pending" | "confirmed" | "completed" | "no-show"
  location: string | null
  total_breaks: number
  breaks_taken: number
  // Joined data from relationships (for display purposes)
  employee?: {
    id: string
    name: string
    department: string | null
    avatar_url: string | null
    position: string | null
    email: string | null
    phone: string | null
  } | null
  shift_type?: {
    id: string
    name: string
    default_start_time: string
    default_end_time: string
  } | null
}

export type Department = {
  id: string
  created_at: string
  name: string
  description: string | null
}

export type SalaryHistory = {
  id: string
  created_at: string
  employee_id: string
  salary: number
  effective_date: string // YYYY-MM-DD format
}
