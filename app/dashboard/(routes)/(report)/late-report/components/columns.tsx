"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ChevronsUpDown } from "lucide-react"
import { CellAction } from "./cell-action"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type TableColumnProps = {
  date: string
  employeeName: string
  department: string
  scheduledTime: string
  timeIn: string
  lateDuration: boolean
  status: string
}

export const columns: ColumnDef<TableColumnProps>[] = [
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
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ChevronsUpDown />
        </Button>
      )
    },
  },
  {
    accessorKey: "employeeName",
    header: "Name",
    size:400,
    cell:({row}) => <div className="whitespace-nowrap">{row.getValue("employeeName")}</div>,
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
    accessorKey: "scheduledTime",
     header: "Scheduled",
  },
  {
    accessorKey: "timeIn",
     header: "Time In",
  },
  {
    accessorKey: "lateDuration",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Late
          <ChevronsUpDown />
        </Button>
      )
    },
    
  },
  {
    accessorKey: "status",
     header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
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
