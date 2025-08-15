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
  shiftType: string
  startTime: string
  endTime: string
  status: string
  employeeName: string
  department: string
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
    header: "Date",
    size:400,
    cell:({row}) => <div className="whitespace-nowrap">{row.getValue("date")}</div>,
  },
  {
    accessorKey: "shiftType",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Shift
          <ChevronsUpDown />
        </Button>
      )
    },
  },
  {
    accessorKey: "startTime",
     header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Start
          <ChevronsUpDown />
        </Button>
      )
    },
  },
  {
    accessorKey: "endTime",
     header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          End
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
    accessorKey: "employeeName",
     header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ChevronsUpDown />
        </Button>
      )
    },
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
    accessorKey: "",
    header: "Action",
    cell: ({row})=> <CellAction data={row.original} />
  },
]
