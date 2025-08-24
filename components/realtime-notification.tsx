"use client"

import { useEffect, useState, useCallback  } from "react"
import { Bell, X, Clock, UserCheck, UserX, AlertTriangle, BellRing, CheckCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/utils/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface Notification {
  id: string
  type: string;
  title: string;
  message: string;
  created_at: string;
  read_by?: string;
  deleted_by?: string;
  read: boolean;
  deleted: boolean;
  send_email?: boolean;

}

interface RealtimeNotificationClientProps {
  userId: string
  error?: string
}

export function RealtimeNotification({
  userId,
  error,
}:RealtimeNotificationClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unReadNotif, setUnReadNotif] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchInitialData = async ()=>{
    const { data:notifs } = await supabase.from("notifications").select("*").order("created_at", { ascending: false})
    
    const formattedNotifications: Notification[] = (notifs || []).map(notif => {
      // Parse read_by JSON string to array
      let readByUsers: string[] = []
      let deletedByUsers: string[] = []
      try {
        readByUsers = JSON.parse(notif.read_by || '[]')
        deletedByUsers = JSON.parse(notif.deleted_by || '[]')
      } catch {
        readByUsers = []
        deletedByUsers = []
      }

      // Check if current user has read this notification
      const isReadByCurrentUser = userId ? readByUsers.includes(userId) : false
      const isDeletedByCurrentUser = userId? deletedByUsers.includes(userId) : false

      return {
        id: notif.id,
        type: notif.type || 'info',
        title: notif.title,
        message: notif.message,
        created_at: notif.created_at,
        read_by: notif.read_by,
        read: isReadByCurrentUser,
        deleted_by: notif.deleted_by,
        deleted: isDeletedByCurrentUser,
        send_email: notif.send_email
      }
    })
    
    //store all notifications
    setNotifications(formattedNotifications);
    const unreadCount = formattedNotifications.filter((n) => !n.read || !n.deleted).length;
    setUnReadNotif(unreadCount);
  }

  useEffect(() => {
    fetchInitialData();

    // Subscribe to schedule changes for notifications
    const scheduleChannel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        handleRealtimeUpdate
      )
      .subscribe()
    return () => {
      supabase.removeChannel(scheduleChannel)
    }
  }, [userId]);

  // Handle every new payload 

  const handleRealtimeUpdate = useCallback((
    payload: RealtimePostgresChangesPayload<any>
  ) => {
    if (payload.eventType === 'INSERT') {
      // Parse read_by for new notifications
      
      let readByUsers: string[] = []
      let deletedByUsers: string[] = []
      
      try {
        readByUsers = JSON.parse(payload.new.read_by || '[]')
        deletedByUsers = JSON.parse(payload.new.deleted_by || '[]')
      } catch {
        readByUsers = []
        deletedByUsers = []
      }

      const newNotification: Notification = {
        id: payload.new.id,
        type: payload.new.type || 'info',
        title: payload.new.title,
        message: payload.new.message,
        created_at: payload.new.created_at,
        read_by: payload.new.read_by,
        read: userId ? readByUsers.includes(userId) : false,
        deleted_by: payload.new.deleted_by,
        deleted: userId ? deletedByUsers.includes(userId) : false,
        send_email: payload.new.send_email
      }
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 49)]) // Keep max 50
      setUnReadNotif( prev => prev + 1);
      
    } else if (payload.eventType === 'UPDATE') {
      // Parse read_by and deleted_by for updated notifications
      let readByUsers: string[] = []
      let deletedByUsers: string[] = []
      try {
        readByUsers = JSON.parse(payload.new.read_by || '[]')
        deletedByUsers = JSON.parse(payload.new.deleted_by || '[]')
      } catch {
        readByUsers = []
        deletedByUsers = []
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === payload.new.id 
            ? { 
                ...notif, 
                read_by: payload.new.read_by,
                read: userId ? readByUsers.includes(userId) : false,
                deleted_by: payload.new.deleted_by,
                deleted: userId ? deletedByUsers.includes(userId) : false
              }
            : notif
        )
      )
    } else if (payload.eventType === 'DELETE') {
      setNotifications(prev => 
        prev.filter(notif => notif.id !== payload.old.id)
      )
          setUnReadNotif( prev => prev - 1 );
    }
  }, [userId])

  const markAsRead = async  (id: string) => {
    if (!userId) return;

    // Get current notification
    const notification = notifications.find(n => n.id === id)
    if (!notification) return
    
    setIsLoading(true)
    try {
    // Parse current read_by array
    let readByUsers: string[] = []
    try {
      readByUsers = JSON.parse(notification.read_by || '[]');
    } catch {
      readByUsers = []
    }    
    // Add current user if not already in array
      if (!readByUsers.includes(userId)) {
        readByUsers.push(userId)

        const { error } = await supabase
          .from('notifications')
          .update({ read_by: JSON.stringify(readByUsers) })
          .eq('id', id)

        if (!error) {
          // update notification
          setNotifications(prev =>
            prev.map(notif =>
              notif.id === id 
                ? { ...notif, read: true, read_by: JSON.stringify(readByUsers) }
                : notif
            )
          )
          // set notification's red dot numbers
          setUnReadNotif( prev => prev - 1)
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
        prev.map(notif => {
          setUnReadNotif( prev => prev - 1)
          return { ...notif, read: true }})
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setUnReadNotif( prev => prev - 1)
  }

  const deleteNotification = async (notificationId: string) => {
    if (!userId) return;  

    setIsLoading(true);
    try {
      // Get current notification
      const notification = notifications.find(n => n.id === notificationId)
      if (!notification) return
   
      let deletedByUsers: string[]=[]
      try {
          deletedByUsers = JSON.parse(notification.deleted_by || '[]')
      } catch {
          deletedByUsers = []
      }

      if (!deletedByUsers.includes(userId)) {
        deletedByUsers.push(userId)
  
        const { error } = await supabase
            .from('notifications')
            .update({ deleted_by: JSON.stringify(deletedByUsers) })
            .eq('id', notificationId)

          if (!error) {
            setNotifications(prev =>
              prev.map(notif =>
                notif.id === notificationId 
                  ? { ...notif, deleted: true, deleted_by: JSON.stringify(deletedByUsers) }
                  : notif
              )
            )
            // set notification's red dot numbers
            setUnReadNotif( prev => prev - 1)
          }
   
        }
      } catch (error) {
        console.error('Error marking notification as read:', error)
      } finally {
        setIsLoading(false)
      }
    }

  const getNotificationIcon = (type: Notification["type"]) => {
    const iconProps = { className: "w-4 h-4" }
    
    switch (type) {
      case "attendance_log_upload":
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
     <DropdownMenu modal={false} open={showNotifications} onOpenChange={setShowNotifications}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-gray-100"
          aria-label={`Notifications ${unReadNotif > 0 ? `(${unReadNotif} unread)` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {unReadNotif > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
              {unReadNotif > 99 ? '99+' : unReadNotif}
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
                {unReadNotif > 0 ? `${unReadNotif} unread` : 'All caught up!'}
              </p>
            </div>
            {unReadNotif > 0 && (
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

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                
              (!notification.deleted) && (  
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
              )
              ))}
            </div>
          )}
          <ScrollBar />
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNotifications([])
                setUnReadNotif(0)
              }}
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
