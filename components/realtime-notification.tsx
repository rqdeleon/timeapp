"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, X, Clock, UserCheck, UserX, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface Notification {
  id: string
  type: "schedule_update" | "employee_update" | "check_in" | "no_show" | "late"
  title: string
  message: string
  created_at: Date
  read: boolean
}

export function RealtimeNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  
  const fetchData = async ()=>{
    const { data:notifs } = await supabase.from("notifications").select("*").order("created_at", { ascending: false})
    
    //store all notifications
    setNotifications(notifs)
    console.log(notifs)
  }

  useEffect(() => {

    fetchData();

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
        async (payload: RealtimePostgresChangesPayload<any>) => {
          let notification: Notification | null = null

          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            // Check for specific status changes
            //@ts-ignore
            const oldStatus = payload.old?.status
            const newStatus = payload.new?.status

            // Fetch employee name and shift type name for notification
            const { data: notifs } = await supabase
              .from("notifications")
              .select("*")
              .eq("id", payload.new.id)
              .single()

            if (oldStatus !== newStatus) {
              switch (newStatus) {
                case "confirmed":
                  notification = {
                    id: `${payload.new.id}-confirmed`,
                    type: "schedule_update",
                    title: "Shift Confirmed",
                    message: `${notifs.message}`,
                    created_at: new Date(),
                    read: false,
                  }
                  break
                case "no-show":
                  notification = {
                    id: `${payload.new.id}-no-show`,
                    type: "no_show",
                    title: notifs.title,
                    message: `${notifs.message}`,
                    created_at: new Date(),
                    read: false,
                  }
                  break
              }
            }

            // Check for check-in updates
            // if (!payload.old?.checked_in_at && payload.new?.checked_in_at) {
            //   const isLate = payload.new?.is_late
            //   notification = {
            //     id: `${payload.new.id}-checkin`,
            //     type: isLate ? "late" : "check_in",
            //     title: isLate ? "Late Check-in" : "Employee Checked In",
            //     message: isLate
            //       ? `${employeeName} checked in ${payload.new.late_minutes} minutes late for their ${shiftTypeName} shift`
            //       : `${employeeName} has checked in for their ${shiftTypeName} shift`,
            //     timestamp: new Date(),
            //     read: false,
            //   }
            // }
          }

          if (notification) {
            setNotifications((prev) => [notification!, ...prev.slice(0, 9)]) // Keep last 10 notifications
          }
        },
      )
      .subscribe()

    // Subscribe to employee changes
    const employeeChannel = supabase
      .channel("employee-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "employees",
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const notification: Notification = {
            id: `${payload.new.id}-new`,
            type: "employee_update",
            title: "New Employee Added",
            message: `${payload.new.name} has been added to the system`,
            created_at: new Date(),
            read: false,
          }

          setNotifications((prev) => [notification, ...prev.slice(0, 9)])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(scheduleChannel)
      supabase.removeChannel(employeeChannel)
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "check_in":
        return <UserCheck className="w-4 h-4 text-green-600" />
      case "no_show":
        return <UserX className="w-4 h-4 text-red-600" />
      case "late":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case "schedule_update":
        return <Clock className="w-4 h-4 text-blue-600" />
      case "employee_update":
        return <UserCheck className="w-4 h-4 text-purple-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)} className="relative">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Live Updates</h3>
            <p className="text-sm text-gray-600">Real-time schedule notifications</p>
          </div>

          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className={`p-4 hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{ new Date(notification.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs"
                        >
                          Mark read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => clearNotification(notification.id)}
                        className="h-6 w-6"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t">
              <Button variant="ghost" size="sm" onClick={() => setNotifications([])} className="w-full text-sm">
                Clear all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
