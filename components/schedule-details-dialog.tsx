"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Schedule } from "@/types"

interface ScheduleDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedules: Schedule[]
  title: string
}

export function ScheduleDetailsDialog({ open, onOpenChange, schedules, title }: ScheduleDetailsDialogProps) {
  const getStatusColorClass = (status: Schedule["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700"
      case "pending":
        return "bg-blue-100 text-blue-700"
      case "completed":
        return "bg-purple-100 text-purple-700"
      case "no-show":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Detailed view of schedules for this selection.</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Shift Type</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No schedules found.
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={schedule.employee?.avatar_url || "/placeholder-user.jpg"}
                            alt={schedule.employee?.name || "Employee"}
                          />
                          <AvatarFallback>
                            {schedule.employee?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {schedule.employee?.name}
                      </div>
                    </TableCell>
                    <TableCell>{schedule.employee?.department || "N/A"}</TableCell>
                    <TableCell>{schedule.shift_type?.name || "N/A"}</TableCell>
                    <TableCell>{`${schedule.start_time} - ${schedule.end_time}`}</TableCell>
                    <TableCell>{schedule.location || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          getStatusColorClass(schedule.status),
                        )}
                      >
                        {schedule.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
