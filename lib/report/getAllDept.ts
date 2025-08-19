"use server"

import { createClient } from "@/lib/utils/supabase/server";

export type DepartmentData = {
  id: string;
  name: string;
}

export async function getAllDepartment(): Promise<DepartmentData[]> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase error fetching departments:', error)
      throw new Error(`Failed to fetch departments: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllDepartment:', error)
    throw error
  }
}