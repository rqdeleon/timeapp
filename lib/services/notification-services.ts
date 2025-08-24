"use server"
import { createClient } from "../utils/supabase/server"
import type { Notifications } from "@/types"

type NotificationsForm = {
  title: string;
  message: string;
  type: string;
}

export async function InsertNotification(notif: NotificationsForm): Promise<Notifications>{
  const supabase = await createClient();

   let query = supabase.from('notifications')
      .insert([notif])
      .select('*')
      .single()
  
  const { data, error } = await query;

  if ( error ) throw new Error('Failed to create notification')
  console.log(`Error on inserting notification`,error)
  return data;
}