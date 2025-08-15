"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ChevronsUpDown } from "lucide-react"
import { CellAction } from "./cell-action"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type AttendanceColumnProps = {
  empId: string
  name: string
  department: string
  totalScheduledHours: number
  totalWorkedHours: number
  lateCount: number
  absences: number
}

export const columns: ColumnDef<AttendanceColumnProps>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() )
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
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    size:400,
    cell:({row}) => <div className="whitespace-nowrap">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "department",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Department
          <ChevronsUpDown />
        </Button>
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
        >
          Scheduled Hours
          <ChevronsUpDown />
        </Button>
      )
    },
  },
  {
    accessorKey: "totalWorkedHours",
     header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Worked Hours
          <ChevronsUpDown />
        </Button>
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
        >
          Tardiness
          <ChevronsUpDown />
        </Button>
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
        >
          Absences
          <ChevronsUpDown />
        </Button>
      )
    },
  },
  {
    accessorKey: "",
    header: "Action",
    cell: ({row})=> <CellAction data={row.original} />
  },
]
