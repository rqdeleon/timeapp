"use client"
import { ColumnDef } from "@tanstack/react-table"
import { Clock, AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AttendanceLog } from "@/types/attendance"
import { AttendanceCellAction } from "./cell-action"
import { OvertimeApprovalButton } from "./overtime-approval-button"
import { format } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

export const attendanceColumns: ColumnDef<AttendanceLog>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    accessorKey: "employeeName",
    header: "Employee",
    cell: ({ row }) => (
      <div className="flex items-center space-x-3">
        <div>
          <div className="font-medium">{row.original.employee?.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.employee?.department?.name}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"))
      return (
        <div className="flex items-center space-x-2">
          <span>{date.toLocaleDateString()}</span>
          {row.original.is_sunday && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Sunday
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "check_in_time",
    header: "Time In",

    cell: ({ row }) => {
      const formattedTimeIn = format(row.getValue("check_in_time"), 'hh:mm a');
      
      return(
        <span className="font-mono">{formattedTimeIn}</span>
      )
    },
  },
  {
    accessorKey: "check_out_time",
    header: "Time Out",
    cell: ({ row }) => {
      const timeOut = row.getValue("check_out_time") ? format(row.getValue("check_out_time"), 'hh:mm a') : "-"
      return (
        <div className="flex items-center space-x-2">
          <span className="font-mono">{timeOut}</span>
          {row.original.check_out_time && (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
          {row.original.is_overnight && (
            <Badge variant="outline" className="text-xs">Overnight</Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "total_hours",
    header: "Total Hours",
    cell: ({ row }) => {

      return(
        <span className="font-medium">
          {row.original.total_hours?.toFixed(2) || '0.00'}h
        </span>
      );
    },
  },
  {
    accessorKey: "overtime_hours_raw",
    header: "OT Hours",
    cell: ({ row }) => {
      const rawOT = row.original.raw_ot_hours || 0
      const approvedOT = row.original.approved_ot_hours || 0
      
      if (rawOT === 0) return <span>-</span>
      
      return (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{rawOT.toFixed(2)}h</span>
          <OvertimeApprovalButton record={row.original} />
        </div>
      )
    },
  },
  {
    accessorKey: "approval_status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("approval_status")
      const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
      }
      return (
        <Badge className={colors[status]}>
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <AttendanceCellAction data={row.original} />
  },
]