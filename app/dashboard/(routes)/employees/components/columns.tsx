"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ChevronsUpDown, User } from "lucide-react"
import { EmployeeCellAction } from "./cell-action"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EmployeeColumnProps, EmployeeStatus } from "@/types"

const getStatusColor = (status: EmployeeStatus) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 hover:bg-green-200'
    case 'inactive':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    case 'terminated':
      return 'bg-red-100 text-red-800 hover:bg-red-200'
    case 'on_leave':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
}

const getStatusLabel = (status: EmployeeStatus) => {
  switch (status) {
    case 'active':
      return 'Active'
    case 'inactive':
      return 'Inactive'
    case 'terminated':
      return 'Terminated'
    case 'on_leave':
      return 'On Leave'
    default:
      return status
  }
}

export const employeeColumns: ColumnDef<EmployeeColumnProps>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
      //@ts-ignore
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
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
          className="h-8 p-0 hover:bg-transparent"
        >
          Employee
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 250,
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      const email = row.original.email
      const avatar = row.original.avatar_url

      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 ">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
              {name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-gray-900">
              {name}
            </div>
            <div className="truncate text-sm text-gray-500">
              {email}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "position",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 hover:bg-transparent"
        >
          Position
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 180,
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("position")}
      </div>
    ),
  },
  {
    accessorKey: "department",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 hover:bg-transparent"
        >
          Department
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 150,
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("department")}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    size: 140,
    cell: ({ row }) => (
      <div className="text-sm font-mono">
        {row.getValue("phone")}
      </div>
    ),
  },
  {
    accessorKey: "salary",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 hover:bg-transparent"
        >
          Salary
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 120,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("salary"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-sm font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 100,
    cell: ({ row }) => {
      const status = row.getValue("status") as EmployeeStatus
      return (
        <Badge 
          variant="secondary" 
          className={`${getStatusColor(status)} border-none`}
        >
          {getStatusLabel(status)}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    header: "Actions",
    size: 80,
    cell: ({ row }) => <EmployeeCellAction data={row.original} />
  },
]