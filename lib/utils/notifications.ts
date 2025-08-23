// lib/notifications.ts
// Utility functions for creating broadcast notifications with read_by tracking

import { createClient } from "./supabase/server"
import { cookies } from 'next/headers'

export type NotificationType = 
  | 'schedule_update' 
  | 'employee_update' 
  | 'check_in' 
  | 'no_show' 
  | 'late' 
  | 'general'
  | 'info'

export interface CreateNotificationData {
  type: NotificationType
  title: string
  message: string
  send_email?: boolean
}

// Create a broadcast notification (visible to all users)
export async function createBroadcastNotification(data: CreateNotificationData) {
  const supabase = await createClient()
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        type: data.type,
        title: data.title,
        message: data.message,
        send_email: data.send_email || false,
        read_by: '[]' // Empty array means no one has read it yet
      })
      .select()
      .single()

    if (error) throw error
    return { notification, error: null }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { notification: null, error }
  }
}

// Helper functions for common notification scenarios

export async function notifyScheduleUpdate(
  employeeName: string, 
  shiftDetails: string
) {
  return createBroadcastNotification({
    type: 'schedule_update',
    title: 'Schedule Updated',
    message: `${employeeName}'s ${shiftDetails} has been updated`,
    send_email: true
  })
}

export async function notifyEmployeeCheckIn(
  employeeName: string,
  shiftType: string,
  isLate: boolean = false,
  lateMinutes?: number
) {
  const title = isLate ? 'Late Check-in Alert' : 'Employee Checked In'
  const message = isLate 
    ? `${employeeName} checked in ${lateMinutes} minutes late for ${shiftType} shift`
    : `${employeeName} has checked in for ${shiftType} shift`

  return createBroadcastNotification({
    type: isLate ? 'late' : 'check_in',
    title,
    message,
    send_email: isLate // Only send email for late check-ins
  })
}

export async function notifyNoShow(
  employeeName: string,
  shiftType: string
) {
  return createBroadcastNotification({
    type: 'no_show',
    title: 'Employee No-Show Alert',
    message: `${employeeName} did not show up for their ${shiftType} shift`,
    send_email: true
  })
}

export async function notifyNewEmployee(
  employeeName: string,
  department?: string
) {
  const message = department 
    ? `${employeeName} has joined the ${department} department`
    : `${employeeName} has been added to the system`

  return createBroadcastNotification({
    type: 'employee_update',
    title: 'New Employee Added',
    message,
    send_email: false
  })
}

export async function notifyGeneralAnnouncement(
  title: string,
  message: string,
  sendEmail: boolean = false
) {
  return createBroadcastNotification({
    type: 'general',
    title,
    message,
    send_email: sendEmail
  })
}

// Mark notification as read by a specific user
export async function markNotificationAsRead(notificationId: string, userId: string) {
  const supabase = await createClient();
  
  try {
    // Get current notification
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('read_by')
      .eq('id', notificationId)
      .single()

    if (fetchError) throw fetchError

    // Parse current read_by array
    let readByUsers: string[] = []
    try {
      readByUsers = JSON.parse(notification.read_by || '[]')
    } catch {
      readByUsers = []
    }

    // Add user if not already in array
    if (!readByUsers.includes(userId)) {
      readByUsers.push(userId)

      const { error } = await supabase
        .from('notifications')
        .update({ read_by: JSON.stringify(readByUsers) })
        .eq('id', notificationId)

      if (error) throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { error }
  }
}

// Get notification statistics (total, read by current user, unread by current user)
export async function getNotificationStats(userId: string) {
  const supabase = await createClient()
  
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('read_by')
      .order('created_at', { ascending: false })

    if (error) throw error

    const stats = {
      total: notifications.length,
      read: 0,
      unread: 0
    }

    notifications.forEach(notification => {
      let readByUsers: string[] = []
      try {
        readByUsers = JSON.parse(notification.read_by || '[]')
      } catch {
        readByUsers = []
      }

      if (readByUsers.includes(userId)) {
        stats.read++
      } else {
        stats.unread++
      }
    })

    return { stats, error: null }
  } catch (error) {
    console.error('Error getting notification stats:', error)
    return { stats: null, error }
  }
}

// Delete old notifications (cleanup function)
export async function deleteOldNotifications(daysOld: number = 30) {
    const supabase = await createClient()
  
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    return { error }
  } catch (error) {
    console.error('Error deleting old notifications:', error)
    return { error }
  }
}