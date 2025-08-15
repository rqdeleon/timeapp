"use client"

import { Download, FileDown, FileText, Printer } from "lucide-react"

import { exportToCSV } from "@/lib/table-actions/export-to-csv"
import { exportToPDF } from "@/lib/table-actions/export-to-pdf"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils";

type DataTableToolbarProps<TData> = {
  tableData: TData[]
  className: string
}

export function DataTableToolbar<TData>({ tableData, className }: DataTableToolbarProps<TData>) {
  const handleExportCSV = () => exportToCSV(tableData, "report.csv")
  //@ts-ignore
  const handleExportPDF = () => exportToPDF(tableData, "report.pdf")

  return (
    <div className={cn("", className)}>
      <DropdownMenu >
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 w-10 p-0">
            <span className="sr-only">Open menu</span>
            <Printer  />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleExportCSV}
          >
             Export CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleExportPDF}
          >
            Export PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
