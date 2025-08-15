"use server"

import { createClient } from "@/utils/supabase/server";

export async function getAllDepartment() {
  const supabase = await createClient()
    
  try {
    let query = supabase
      .from("departments")
      .select('*'
      ).order('name')

    const { data, error } = await query;

    if (error) console.log(error)

    // Format the results into a simpler report
    const allDept = data.map((record: any) => {
      const deptId = record.id;
      const department = record.name;
      return {
        id: deptId,
        name: department || "Unknown",
      }
    })
    return allDept;
  } catch (err: any) {
    return null
  }
}
