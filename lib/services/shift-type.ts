import { createClient } from "../utils/supabase/server"
import { ShiftType } from "@/types";

export const getAllShiftType = async ():Promise<ShiftType[]>=>{
  const supabase = await createClient();

  const { data: shiftTypeData, error } = await supabase
    .from("shift_types")
    .select("*")
    .order("name")
  if (error ) console.log(error);

  return shiftTypeData;
}

