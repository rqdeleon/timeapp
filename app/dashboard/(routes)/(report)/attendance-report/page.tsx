"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AttendanceReportClient } from './components/client'
import { getAttendance } from '@/lib/report/getAttendance' 
import ReportGenerator from './components/report-generator'

export default function AttendacePage() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  const [ data, setData ] = useState([])
  const [ startDate, setStartDate] = useState<Date>(firstDay)
  const [ endDate, setEndDate] = useState<Date>(lastDay)
  const [ department, setDepartment ] = useState("it")
  

  const fetchData = async ()=>{
    const data = await getAttendance(formatDate(startDate),formatDate(endDate),department)
    // set initial data on first load
    setData(data)
  }
  
  useEffect(()=>{
    fetchData()
  },[startDate, endDate])

  return (
    <main>
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
            <ReportGenerator
              startDate={startDate}
              endDate={endDate}
              department={department}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              setDepartment={setDepartment}
            />
            <Card>
              <CardContent className="py-4">
                <AttendanceReportClient data={data} />
              </CardContent>
            </Card>
        </div>
      </div>
    </main>
  )
}

