"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ChevronsUpDown, Clock, Calendar, Zap, AlertTriangle } from "lucide-react"
import { CellAction } from "./cell-action"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Enhanced type with new fields
export type AttendanceColumnProps = {
  empId: string
  name: string
  department: string
  totalScheduledHours: number
  totalWorkedHours: number
  lateCount: number
  absences: number
  overtimeHours: number
  scheduledDays: number
  workedDays: number
  unscheduledWorkDays: number
}

export const columns: ColumnDef<AttendanceColumnProps>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected())
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Employee Name
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 200,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "department",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Department
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const department = row.getValue("department") as string
      return (
        <Badge variant="secondary" className="font-normal">
          {department || 'Unassigned'}
        </Badge>
      )
    },
  },
  {
    accessorKey: "workedDays",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          <Calendar className="mr-1 h-3 w-3" />
          Days
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const workedDays = row.getValue("workedDays") as number
      const scheduledDays = row.getValue("scheduledDays") as number
      const unscheduledDays = row.getValue("unscheduledWorkDays") as number
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center">
                <div className="font-mono font-semibold">
                  {workedDays}/{scheduledDays || 0}
                </div>
                {unscheduledDays > 0 && (
                  <div className="text-xs text-orange-600">
                    +{unscheduledDays} extra
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div>Worked: {workedDays} days</div>
                <div>Scheduled: {scheduledDays || 0} days</div>
                {unscheduledDays > 0 && (
                  <div>Unscheduled work: {unscheduledDays} days</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    accessorKey: "totalScheduledHours",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          <Clock className="mr-1 h-3 w-3" />
          Scheduled
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const hours = parseFloat(row.getValue("totalScheduledHours"))
      return <div className="text-center font-mono">{hours.toFixed(1)}h</div>
    },
  },
  {
    accessorKey: "totalWorkedHours",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          <Clock className="mr-1 h-3 w-3" />
          Worked
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const worked = parseFloat(row.getValue("totalWorkedHours"))
      const scheduled = parseFloat(row.getValue("totalScheduledHours"))
      const percentage = scheduled > 0 ? (worked / scheduled) * 100 : 0
      
      const getColor = () => {
        if (percentage >= 95) return "text-green-600"
        if (percentage >= 80) return "text-yellow-600"
        return "text-red-600"
      }

      return (
        <div className="text-center">
          <div className={`font-mono font-semibold ${getColor()}`}>
            {worked.toFixed(1)}h
          </div>
          {scheduled > 0 && (
            <div className="text-xs text-muted-foreground">
              ({percentage.toFixed(0)}%)
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "overtimeHours",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          <Zap className="mr-1 h-3 w-3" />
          Overtime
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const overtime = parseFloat(row.getValue("overtimeHours"))
      return (
        <div className="text-center">
          <Badge 
            variant={overtime === 0 ? "secondary" : overtime <= 5 ? "default" : "destructive"}
            className="font-mono"
          >
            {overtime.toFixed(1)}h
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "lateCount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          <AlertTriangle className="mr-1 h-3 w-3" />
          Late
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const lateCount = row.getValue("lateCount") as number
      return (
        <div className="text-center">
          <Badge 
            variant={lateCount === 0 ? "secondary" : lateCount <= 2 ? "default" : "destructive"}
            className="font-mono"
          >
            {lateCount}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "absences",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Absences
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const absences = row.getValue("absences") as number
      return (
        <div className="text-center">
          <Badge 
            variant={absences === 0 ? "secondary" : absences <= 1 ? "default" : "destructive"}
            className="font-mono"
          >
            {absences}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <CellAction data={row.original} />
  },
]