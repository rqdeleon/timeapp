
"use client"

import { useState, useEffect } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { TimeinReportClient } from './components/client'
import { getTimeinReport } from '@/lib/report/getTimeInLogs'
import ReportGenerator from './components/report-generator'

export default function TimeInReportPage() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  const [ data, setData ] = useState([])
  const [ startDate, setStartDate] = useState<Date>(firstDay)
  const [ department, setDepartment ] = useState("")
  const [ allDept, setAllDept ] = useState()

  const fetchData = async ()=>{
    const data = await getTimeinReport(formatDate(startDate))
    // set initial data on first load
    setData(data)
  }
  
  useEffect(()=>{
    fetchData()
  },[startDate])


  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ReportGenerator 
          startDate={startDate}
          department={department}
          setStartDate={setStartDate}
          setDepartment={setDepartment}
        />
        <Card>
          <CardContent className="py-4">
             <TimeinReportClient data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

