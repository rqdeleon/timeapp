"use client"
import React from 'react'
import { useState, useEffect } from 'react'
import { ChevronDownIcon,Loader2 } from "lucide-react"

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
import { getAllDepartment } from '@/lib/report/getAllDept'

interface ReportGeneratorProps {
  startDate: Date
  endDate: Date
  department?: string
  setStartDate: (date:Date)=> void
  setEndDate: (date:Date)=> void
  setDepartment?: (dept:string)=> void
}
type DeptProps = {
  id:string
  name:string
}

function ReportGenerator({ 
  startDate, 
  endDate, 
  department, 
  setStartDate, 
  setEndDate, 
  setDepartment,
}:ReportGeneratorProps ) {

  const [loading, setLoading] = useState(false)
  const [openStartDate, setOpenStartDate] = useState(false)
  const [openEndDate, setOpenEndDate] = useState(false)
  const [initDept, setInitDept ] = useState<DeptProps[]>()
  
  const fetchAllDept = async ()=>{
    try {
      setLoading(true)
      const alldept = await getAllDepartment()
      setInitDept(alldept)
    } catch (error) {
      throw error
    } finally{
      setLoading(false)
    }

  }

  useEffect(()=>{
    fetchAllDept()
  },[])

  //------------------ ACTIONS --------------------//
  const onSubmit = ()=>{
    try {
      setLoading(true)
    } catch (error) {
      
    } finally{

    }
  }

  return (
    <div className='flex gap-4'>
      <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="w-48 justify-between font-normal"
            disabled={loading}
          >
            {startDate ? startDate.toLocaleDateString() : "Select date"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            disabled={loading}
            captionLayout="dropdown"
            onSelect={(date) => {
              setStartDate(date)
              setOpenStartDate(false)
            }}
          />
        </PopoverContent>
      </Popover>
            <Popover open={openEndDate} onOpenChange={setOpenEndDate}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="w-48 justify-between font-normal"
            disabled={loading}
          >
            {endDate ? endDate.toLocaleDateString() : "Select date"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            captionLayout="dropdown"
            disabled={loading}
            onSelect={(date) => {
              setEndDate(date)
              setOpenEndDate(false)
            }}
          />
        </PopoverContent>
      </Popover>
      
      {department && 
        <Select disabled={loading} defaultValue={department}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {initDept && initDept.map((dept, index)=>(
                <SelectItem key={index} value={dept.name}>{dept.name}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      }

      <div className="md:col-span-3 flex justify-end">
        <Button onClick={onSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Report
        </Button>
      </div>

    </div>
  )
}

export default ReportGenerator