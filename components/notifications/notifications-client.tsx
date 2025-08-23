"use client"

import { useEffect, useState, useCallback } from "react"
import { 
  Bell, 
  X, 
  Clock, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  BellRing,
  CheckCircle
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/utils/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { Notification } from "./notifications-server"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NotificationClientProps {
  initialNotifications: Notification[]
  userId?: string
  error?: string
}

export function NotificationClient({ 
  initialNotifications, 
  userId,
  error 
}: NotificationClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false);

  // Setup real-time subscription
  useEffect(() => {
    if (error) return

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          ...(userId && { filter: `user_id=eq.${userId}` })
        },
        handleRealtimeUpdate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, error])

  const handleRealtimeUpdate = useCallback((
    payload: RealtimePostgresChangesPayload<any>
  ) => {
    if (payload.eventType === 'INSERT') {
      // Parse read_by for new notifications
      let readByUsers: string[] = []
      try {
        readByUsers = JSON.parse(payload.new.read_by || '[]')
      } catch {
        readByUsers = []
      }

      const newNotification: Notification = {
        id: payload.new.id,
        type: payload.new.type || 'info',
        title: payload.new.title,
        message: payload.new.message,
        created_at: payload.new.created_at,
        read_by: payload.new.read_by,
        read: userId ? readByUsers.includes(userId) : false,
        send_email: payload.new.send_email
      }
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 49)]) // Keep max 50
    } else if (payload.eventType === 'UPDATE') {
      // Parse read_by for updated notifications
      let readByUsers: string[] = []
      try {
        readByUsers = JSON.parse(payload.new.read_by || '[]')
      } catch {
        readByUsers = []
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === payload.new.id 
            ? { 
                ...notif, 
                read_by: payload.new.read_by,
                read: userId ? readByUsers.includes(userId) : false
              }
            : notif
        )
      )
    } else if (payload.eventType === 'DELETE') {
      setNotifications(prev => 
        prev.filter(notif => notif.id !== payload.old.id)
      )
    }
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = async (notificationId: string) => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      // Get current notification
      const notification = notifications.find(n => n.id === notificationId)
      if (!notification) return

      // Parse current read_by array
      let readByUsers: string[] = []
      try {
        readByUsers = JSON.parse(notification.read_by || '[]')
      } catch {
        readByUsers = []
      }

      // Add current user if not already in array
      if (!readByUsers.includes(userId)) {
        readByUsers.push(userId)

        const { error } = await supabase
          .from('notifications')
          .update({ read_by: JSON.stringify(readByUsers) })
          .eq('id', notificationId)

        if (!error) {
          setNotifications(prev =>
            prev.map(notif =>
              notif.id === notificationId 
                ? { ...notif, read: true, read_by: JSON.stringify(readByUsers) }
                : notif
            )
          )
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      
      if (unreadNotifications.length === 0) return

      // Process each unread notification
      const updatePromises = unreadNotifications.map(async (notification) => {
        // Parse current read_by array
        let readByUsers: string[] = []
        try {
          readByUsers = JSON.parse(notification.read_by || '[]')
        } catch {
          readByUsers = []
        }

        // Add current user if not already in array
        if (!readByUsers.includes(userId)) {
          readByUsers.push(userId)

          return supabase
            .from('notifications')
            .update({ read_by: JSON.stringify(readByUsers) })
            .eq('id', notification.id)
        }
        return null
      })

      await Promise.all(updatePromises.filter(Boolean))

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (!error) {
        setNotifications(prev =>
          prev.filter(notif => notif.id !== notificationId)
        )
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    const iconProps = { className: "w-4 h-4" }
    
    switch (type) {
      case "check_in":
        return <UserCheck {...iconProps} className="w-4 h-4 text-green-600" />
      case "no_show":
        return <UserX {...iconProps} className="w-4 h-4 text-red-600" />
      case "late":
        return <AlertTriangle {...iconProps} className="w-4 h-4 text-orange-600" />
      case "schedule_update":
        return <Clock {...iconProps} className="w-4 h-4 text-blue-600" />
      case "employee_update":
        return <UserCheck {...iconProps} className="w-4 h-4 text-purple-600" />
      default:
        return <BellRing {...iconProps} className="w-4 h-4 text-gray-600" />
    }
  }

  const formatNotificationTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
  }

  if (error) {
    return (
      <div className="relative">
        <Button variant="ghost" size="icon" disabled>
          <Bell className="w-5 h-5 text-gray-400" />
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-gray-100"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isLoading}
                className="text-xs"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? "text-gray-900" : "text-gray-700"
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatNotificationTime(notification.created_at)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              disabled={isLoading}
                              className="text-xs h-6 px-2"
                            >
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotifications([])}
              className="w-full text-sm text-gray-600 hover:text-gray-900"
            >
              Clear all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}