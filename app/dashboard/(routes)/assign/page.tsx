"use client"
import { useState, useEffect } from 'react'

import { supabase } from '@/lib/supabase'
import CalendarByEmployee from './component/calendayByEmployee'
  import { DepartmentCoverage, ScheduleOverview, ShiftDistribution } from './component/overview-box'
import { Schedule, ShiftType, Employee, Department } from '@/types'
import { useRealtimeSchedules } from '@/hooks/use-realtime-schedules'
import { AssignShiftForm } from './component/assign-shift-form'

export default function AssignPage() {
  const [ shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [ initialSchedules, setInitialSchedules] = useState<Schedule[]>([])
  const [AllDepartment, SetDepartment] = useState<Department[]>([])
  const [initEmployees, setInitEmployee] = useState<Employee[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [deptStats, setDepartStats] = useState([{    
    name: "",
    covered: 0,
    total: 0,
    percentage: 0,
  }])

  // States for assiging shift dialog
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee>()
  const [clickDate, setClickDate ]= useState<Date>(new Date)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null) // State for editing

  const allSchedules = useRealtimeSchedules(initialSchedules)

  useEffect(() => {
      fetchInitialData()
    }, [currentDate])
  
  const fetchInitialData = async () => {
      try {
        
        // Fetch shift types
        const { data: shiftTypesData, error: shiftTypesError } = await supabase
          .from("shift_types")
          .select("*")
          .order("name")
        if (shiftTypesError) throw shiftTypesError
        setShiftTypes(shiftTypesData || [])
        
        // Get the current week's date range
        const weekDates = generateWeekDates()
        const startDate = weekDates[0].toISOString().split("T")[0]
        const endDate = weekDates[6].toISOString().split("T")[0]

        // Fetch schedules
        const { data: schedulesData, error: schedulesError } = await supabase
          .from("schedules")
          .select(
            `
            *,
            employees:employee_id(name, department, position, email, phone),
            shift_type:shift_type_id(name, default_start_time, default_end_time)
          `,
          )
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true })
  
        if (schedulesError) throw schedulesError
  
        const normalizedSchedules = (schedulesData ?? []).map((row) => ({
          ...row,
          employee: row.employees,
          shift_type: row.shift_type,
        })) as Schedule[]
        
        /* Fetch all departments */
        const { data: deptData, error: deptErr } = await supabase.from("departments").select("*").order("name")
        if (deptErr) throw deptErr
        
        // Fetch all employeed
        const { data: employeeData, error: employeeErr} = await supabase.from("employees")
        .select('*')
        .order("name")
        if (employeeErr) throw employeeErr


        setInitEmployee(employeeData)
        setInitialSchedules(normalizedSchedules)
        SetDepartment(deptData)

      } catch (error) {
        console.error("Error fetching initial data for schedule page:", error)
      } 
    }

  const generateWeekDates = () => {
    const week = []
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust to start on Monday
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      week.push(date)
    }
    return week
  }

  const weekDates = generateWeekDates()

  // --------------------   Calculate statistics for overview boxes -------------------------
  const weekSchedules = allSchedules
  const totalScheduledHours = weekSchedules.reduce((total, schedule) => {
  const start = new Date(`2000-01-01T${schedule.start_time}`)
  const end = new Date(`2000-01-01T${schedule.end_time}`)
  let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

  // Handle overnight shifts
  if (hours < 0) {
    hours += 24
  }

    return total + hours
  }, 0)

  const totalShifts = weekSchedules.length
  const coveredShifts = weekSchedules.filter((s) => s.status === "confirmed" || s.status === "completed").length
  const coveragePercentage = totalShifts > 0 ? Math.round((coveredShifts / totalShifts) * 100) : 0
  const pendingShifts = weekSchedules.filter((s) => s.status === "pending").length

    // Department coverage analysis
  const departments = Array.from(new Set(allSchedules.map((s) => s.employee?.department).filter(Boolean))) as string[]
  const departmentStats = departments
  .map((dept) => {
    const deptSchedules = weekSchedules.filter((s) => s.employee?.department === dept)
    const coveredCount = deptSchedules.filter((s) => s.status === "confirmed" || s.status === "completed").length
    const totalCount = deptSchedules.length
    return {
      name: dept,
      covered: coveredCount,
      total: totalCount,
      percentage: totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0,
    }
  })
  .filter((dept) => dept.total > 0) // Only show departments with schedules
  
  //-------------- ACTIONS --------------------------//
  const handleCellClick = (employee: Employee, date: Date, shift:Schedule ) =>{
      setShowDetailsDialog(true)
      setSelectedEmployee(employee)
      setClickDate(date)
      setSelectedSchedule(shift)
  }

  return (
    <main>
        {/* Calendar  */}
        <CalendarByEmployee 
          allSchedules={allSchedules}
          departments={AllDepartment}
          employees={initEmployees}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          handleCellClick={handleCellClick}
        />
        <ScheduleOverview 
          weekSchedules={ weekSchedules}
          departmentStats={departmentStats}
        />
        {/* Stats overview */}
        <DepartmentCoverage 
          deptStats={departmentStats}
        />
        
        <ShiftDistribution 
          allShifts={shiftTypes}
          weekSchedules={weekSchedules}        
        />

        <AssignShiftForm
           open={showDetailsDialog}
           onOpenChange={setShowDetailsDialog}
           employee={selectedEmployee}
           date={clickDate}
           onSaved={fetchInitialData}
           initData={selectedSchedule}
        />
    </main>
  )
}
