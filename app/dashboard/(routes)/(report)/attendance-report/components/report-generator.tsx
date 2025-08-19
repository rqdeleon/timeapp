"use client"
import React from 'react'
import { useState, useEffect } from 'react'
import { ChevronDownIcon, Loader2, Download, FileSpreadsheet, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAllDepartment } from '@/lib/report/getAllDept'
import { useToast } from "@/components/ui/use-toast"

interface ReportGeneratorProps {
  startDate: Date
  endDate: Date
  department: string
  setStartDate: (date: Date) => void
  setEndDate: (date: Date) => void
  setDepartment: (dept: string) => void
  loading?: boolean
  onGenerate?: () => void
}

type DeptProps = {
  id: string
  name: string
}

function ReportGenerator({ 
  startDate, 
  endDate, 
  department, 
  setStartDate, 
  setEndDate, 
  setDepartment,
  loading = false,
  onGenerate,
}: ReportGeneratorProps) {

  const [deptLoading, setDeptLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [openStartDate, setOpenStartDate] = useState(false)
  const [openEndDate, setOpenEndDate] = useState(false)
  const [initDept, setInitDept] = useState<DeptProps[]>([])
  const { toast } = useToast()
  
  const fetchAllDept = async () => {
    try {
      setDeptLoading(true)
      const alldept = await getAllDepartment()
      setInitDept(alldept || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load departments"
      })
    } finally {
      setDeptLoading(false)
    }
  }

  useEffect(() => {
    fetchAllDept()
  }, [])

  const handleDateSelect = (date: Date | undefined, type: 'start' | 'end') => {
    if (!date) return
    
    if (type === 'start') {
      if (date > endDate) {
        toast({
          variant: "destructive",
          title: "Invalid Date Range",
          description: "Start date cannot be after end date"
        })
        return
      }
      setStartDate(date)
      setOpenStartDate(false)
    } else {
      if (date < startDate) {
        toast({
          variant: "destructive",
          title: "Invalid Date Range", 
          description: "End date cannot be before start date"
        })
        return
      }
      setEndDate(date)
      setOpenEndDate(false)
    }
  }

  const handleDepartmentChange = (value: string) => {
    setDepartment(value)
  }

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setExportLoading(true)
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        department: department === 'all' ? '' : department,
        format
      })

      const response = await fetch(`/api/attendance/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      const filename = `attendance-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export Successful",
        description: `Report exported as ${format.toUpperCase()}`
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export report. Please try again."
      })
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className='flex flex-wrap gap-4 items-center'>
      <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-48 justify-between font-normal"
            disabled={loading || deptLoading}
          >
            {startDate ? startDate.toLocaleDateString() : "Select start date"}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            disabled={loading || deptLoading}
            captionLayout="dropdown"
            onSelect={(date) => handleDateSelect(date, 'start')}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover open={openEndDate} onOpenChange={setOpenEndDate}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-48 justify-between font-normal"
            disabled={loading || deptLoading}
          >
            {endDate ? endDate.toLocaleDateString() : "Select end date"}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            disabled={loading || deptLoading}
            captionLayout="dropdown"
            onSelect={(date) => handleDateSelect(date, 'end')}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      <Select 
        disabled={loading || deptLoading} 
        value={department} 
        onValueChange={handleDepartmentChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All Departments</SelectItem>
            {initDept.map((dept) => (
              <SelectItem key={dept.id} value={dept.name}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button 
        onClick={onGenerate} 
        disabled={loading || deptLoading}
        className="min-w-[140px]"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Generate Report
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            disabled={loading || deptLoading || exportLoading}
            className="min-w-[100px]"
          >
            {exportLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileText className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default ReportGenerator