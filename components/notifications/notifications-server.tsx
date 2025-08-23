"use server"
// app/components/notifications/notifications-server.tsx
import { createClient } from '@/lib/utils/supabase/server'
import { NotificationClient } from '@/components/notifications/notifications-client'

export interface Notification {
  id: string
  type: "schedule_update" | "employee_update" | "check_in" | "no_show" | "late" | "general" | "info"
  title: string
  message: string
  created_at: string
  read_by: string
  read: boolean // computed field for current user
  send_email?: boolean
}

export interface NotificationsServerProps {
  userId?: string
  limit?: number
}

export async function NotificationsServer({ 
  userId, 
  limit = 10 
}: NotificationsServerProps = {}) {
  const supabase = await createClient()
  
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching notifications:', error)
      return null
    }

    const formattedNotifications: Notification[] = (notifications || []).map(notif => {
      // Parse read_by JSON string to array
      // let readByUsers: string[] = []
      // try {
      //   readByUsers = JSON.parse(notif.read_by || '[]')
      // } catch {
      //   readByUsers = []
      // }

      // // Check if current user has read this notification
      // const isReadByCurrentUser = userId ? readByUsers.includes(userId) : false

      return {
        id: notif.id,
        type: notif.type || 'info',
        title: notif.title,
        message: notif.message,
        created_at: notif.created_at,
        read_by: notif.read_by,
        read: false,
        send_email: notif.send_email
      }
    })

    return (
      <NotificationClient 
        initialNotifications={formattedNotifications}
        userId={userId}
      />
    )
  } catch (error) {
    console.error('Error in NotificationsServer:', error)
    return <NotificationClient initialNotifications={[]} error="Something went wrong" />
  }
}