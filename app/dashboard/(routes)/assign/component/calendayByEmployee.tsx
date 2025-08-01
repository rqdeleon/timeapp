"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Schedule, Employee, Department, ShiftType } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import  ShiftCard  from "./shift-card"

interface CalendarProps {
  allSchedules: Schedule[],
  employees: Employee[],
  departments: Department[],
  currentDate: Date,
  setCurrentDate: ( newDate: Date)=> void,
  handleCellClick: ( employee: Employee, date: Date, shift:Schedule) => void,
}

export const CalendarByEmployee: React.FC<CalendarProps> = ({allSchedules, employees, departments, currentDate, setCurrentDate, handleCellClick})=> {
  const [searchQuery, setSearchQuery] = useState("")
  const [deptFilter, setDeptFilter] = useState("all") // "all" or department name (string)

  const weekDays = ["Sunday","Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", ]

  const getShiftForDateAndEmployee = (employeeId: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return allSchedules.filter((schedule) => schedule.employee_id === employeeId && schedule.date === dateStr )
  }

  const generateWeekDates = () => {
    const week = []
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 0) // Adjust to start on Sunday
    startOfWeek.setDate(diff)
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      week.push(date)
    }
    return week
  }
  // GENERATE THE WEEKDATES
  const weekDates = generateWeekDates()

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  const shiftCardColor = (status: Schedule["status"]) => {
    switch (status) {
      case "confirmed":
        return "border-green-500 bg-green-50"
      case "pending":
        return "border-yellow-500 bg-yellow-50"
      case "completed":
        return "border-blue-500 bg-blue-50"
      case "no-show":
        return "border-red-500 bg-red-50"
      default:
        return "border-gray-500 bg-gray-50"
    }
  }

    // -------------   FILTER EMPLOYEE BY DEPARTMENT ----------------------///
  const filteredEmployee = useMemo(()=>{
    
   return employees.filter((employee)=>{
      const matchesDepartment = deptFilter === "all" || employee.department === deptFilter 
      const matchesName = searchQuery.trim() === "" || [employee.name].some((field) =>
        field?.toLowerCase().includes(searchQuery.trim().toLowerCase()))
     
      return matchesDepartment && matchesName 
    })
    
  },[deptFilter, employees, searchQuery ])

  return(
     <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assign Shifts</h1>
              <p className="text-gray-600 mt-1">Manage employee shifts and schedules</p>
            </div>
          </div>

          {/* Week Navigation */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                <div className="flex gap-4 items-center">
                  {/* Weekly navigation */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-4">
                      {weekDates[0]?.toLocaleDateString()} - {weekDates[6]?.toLocaleDateString()}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Search */}
                  <div className="space-y-1 sm:col-span-3">
                    <Input
                      id="search"
                      type="text"
                      placeholder="search name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Department */}
                  <div className="min-w-52">
                    <Select
                      value={deptFilter}
                      onValueChange={(v) => setDeptFilter(v)} // always a string
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All departments</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.name}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear */}
                  {/* <div className="flex items-end">
                    <Button variant="outline" className="w-full sm:w-auto bg-transparent" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  </div> */}

                </div>
              </div>
            </CardHeader>
            <CardContent>
            {/* ------------------------ CALENDAR BY EMPLOYEE -------------------------------- */}
              <div className="flex-1 overflow-x-auto">
                <div className="grid grid-cols-8 min-w-[800px] auto-rows-min border-b ">
                  {/* Header */}

                  <div className="font-medium text-sm text-gray-600 p-2 left-0 border-b border-r"> 
                    {/* blank */}
                  </div>

                  {weekDates.map((date, index) => (
                    <div key={index} className="left-0 border-b border-r border-t font-medium text-sm text-gray-600 p-2 text-center">
                      <div>{weekDays[index]}</div>
                      <div className="text-xs text-gray-500">{date.getDate()}</div>
                    </div>
                  ))}
                  
                  {/* EMPLOYEE ROWS */}
                  {filteredEmployee.map((employee) => (
                    <div key={employee.id} className="contents">
                      <div className="left-0 border-l border-b border-r bg-white p-3 flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.avatar_url || " " } alt={employee.name} />
                          <AvatarFallback className="text-gray-400">{employee.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="hidden md:flex flex-col p-2 text-xs">
                           <p> {employee.name} </p>
                           <span className="w-4 h-4 text-xs text-gray-500"> {employee.department}</span>
                        </div>
                      </div>

                      {/* Dates per week */}
                      {weekDates.map((date, dateIndex) => {
                        const shifts = getShiftForDateAndEmployee(employee.id, date)
                        return (
                          <div
                            key={dateIndex}
                            className="flex items-center justify-center border-b border-r cursor-pointer hover:bg-gray-100"
                            onClick={() =>  handleCellClick(employee, date, shifts[0])  } // Make cell clickable
                          >
                            {shifts.map((s, i) =>{ 
                              return (
                                <ShiftCard 
                                  key={i} time={s.start_time} 
                                  shift={ (s.shift_type?.name) ? s.shift_type?.name : " " } 
                                  color={shiftCardColor(s.status)} 
                                  className="mb-2 last:mb-0" 
                                />

                              )})
                            }
                            {shifts.length === 0 && (
                              <div className="text-xs text-gray-400 text-center py-4">No shifts</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>          
        </main>
      </div>
  )
}

export default CalendarByEmployee;

// export  function CalendarByEmployee2() {
//   const [currentDate, setCurrentDate] = useState(new Date())
//   const [initialSchedules, setInitialSchedules] = useState<Schedule[]>([])
//   const [initEmployees, setInitEmployee] = useState<Employee[]>([])
//   const [AllDepartment, SetDepartment] = useState<Department[]>([])
//   const [deptFilter, setDeptFilter] = useState("all") // "all" or department name (string)
//   const [loading, setLoading] = useState(true)
//   const [searchQuery, setSearchQuery] = useState("")

//   // Use real-time hook for schedules
//   const allSchedules = useRealtimeSchedules(initialSchedules)

//   useEffect(() => {
//     fetchInitialData()
//   }, [currentDate])

//   const fetchInitialData = async () => {
//     setLoading(true)
//     try {
//       // Get the current week's date range
//       const weekDates = generateWeekDates()
//       const startDate = weekDates[0].toISOString().split("T")[0]
//       const endDate = weekDates[6].toISOString().split("T")[0]

//       const { data: schedulesData, error: schedulesError } = await supabase
//         .from("schedules")
//         .select(
//           `
//           *,
//           employees:employee_id(name, department, position, email, phone, user_id),
//           shift_type:shift_type_id(name, default_start_time, default_end_time)
//         `,
//         )
//         .gte("date", startDate)
//         .lte("date", endDate)
//         .order("date", { ascending: true })
//         .order("start_time", { ascending: true })

//       if (schedulesError) throw schedulesError

//       const normalizedSchedules = (schedulesData ?? []).map((row) => ({
//         ...row,
//         employee: row.employees,
//         shift_type: row.shift_type,
//       })) as Schedule[]

//       const { data: employeeData, error: employeeErr} = await supabase.from("employees")
//       .select('*')
//       .order("name")
//       if (employeeErr) throw employeeErr

//       /* Departments query */
//       const { data: deptData, error: deptErr } = await supabase.from("departments").select("*").order("name")
//       if (deptErr) throw deptErr

//       SetDepartment(deptData ?? [])
//       setInitialSchedules(normalizedSchedules)
//       setInitEmployee(employeeData)

//     } catch (error) {
//       console.error("Error fetching initial data for schedule page:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const weekDays = ["Sunday","Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", ]

//   const getShiftForDateAndEmployee = (employeeId: string, date: Date) => {
//     const dateStr = date.toISOString().split("T")[0]
//     return allSchedules.filter((schedule) => schedule.employee_id === employeeId && schedule.date === dateStr )
//   }

//   const generateWeekDates = () => {
//     const week = []
//     const startOfWeek = new Date(currentDate)
//     const day = startOfWeek.getDay()
//     const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 0) // Adjust to start on Sunday
//     startOfWeek.setDate(diff)
//     for (let i = 0; i < 7; i++) {
//       const date = new Date(startOfWeek)
//       date.setDate(startOfWeek.getDate() + i)
//       week.push(date)
//     }
//     return week
//   }
//   // GENERATE THE WEEKDATES
//   const weekDates = generateWeekDates()

//   const navigateWeek = (direction: number) => {
//     const newDate = new Date(currentDate)
//     newDate.setDate(currentDate.getDate() + direction * 7)
//     setCurrentDate(newDate)
//   }

//   // -------------   FILTER EMPLOYEE BY DEPARTMENT ----------------------///
//   const filteredEmployee = useMemo(()=>{
    
//    return initEmployees.filter((employee)=>{
//       const matchesDepartment = deptFilter === "all" || employee.department === deptFilter 
//       const matchesName = searchQuery.trim() === "" || [employee.name].some((field) =>
//         field?.toLowerCase().includes(searchQuery.trim().toLowerCase()))
     
//       return matchesDepartment && matchesName 
//     })
    
//   },[deptFilter, initEmployees, searchQuery ])

//   const handleClearFilters = ()=>{
//     setDeptFilter("all")
//     setSearchQuery("")
//   }

//   // const handleCellClick = (employee:Employee, date: Date, shifts:Schedule) => {
//   //   if(!employee) return null
//   //   setSelectedEmployee(employee)
//   //   setSelectedSchedule(shifts)
//   //   setClickDate(date)
//   //   setShowDetailsDialog(true)
//   // }

//   const shiftCardColor = (status: Schedule["status"]) => {
//     switch (status) {
//       case "confirmed":
//         return "border-green-500 bg-green-50"
//       case "pending":
//         return "border-yellow-500 bg-yellow-50"
//       case "completed":
//         return "border-blue-500 bg-blue-50"
//       case "no-show":
//         return "border-red-500 bg-red-50"
//       default:
//         return "border-gray-500 bg-gray-50"
//     }
//   }

//   return (
//       <div className="min-h-screen bg-gray-50">
//         <main className="container mx-auto px-4 py-8">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Assign Shifts</h1>
//               <p className="text-gray-600 mt-1">Manage employee shifts and schedules</p>
//             </div>
//           </div>

//           {/* Week Navigation */}
//           <Card className="mb-6">
//             <CardHeader>
//               <div className="flex flex-col md:flex-row items-center justify-between gap-4">

//                 <div className="flex gap-4 items-center">
//                   {/* Weekly navigation */}
//                   <div className="flex items-center gap-2">
//                     <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
//                       <ChevronLeft className="w-4 h-4" />
//                     </Button>
//                     <span className="text-sm font-medium px-4">
//                       {weekDates[0]?.toLocaleDateString()} - {weekDates[6]?.toLocaleDateString()}
//                     </span>
//                     <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
//                       <ChevronRight className="w-4 h-4" />
//                     </Button>
//                   </div>

//                   {/* Search */}
//                   <div className="space-y-1 sm:col-span-3">
//                     <Input
//                       id="search"
//                       type="text"
//                       placeholder="search name"
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                     />
//                   </div>

//                   {/* Department */}
//                   <div className="min-w-52">
//                     <Select
//                       value={deptFilter}
//                       onValueChange={(v) => setDeptFilter(v)} // always a string
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="All departments" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All departments</SelectItem>
//                         {AllDepartment.map((d) => (
//                           <SelectItem key={d.id} value={d.name}>
//                             {d.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   {/* Clear */}
//                   <div className="flex items-end">
//                     <Button variant="outline" className="w-full sm:w-auto bg-transparent" onClick={handleClearFilters}>
//                       Clear Filters
//                     </Button>
//                   </div>

//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//             {/* ------------------------ CALENDAR BY EMPLOYEE -------------------------------- */}
//               <div className="flex-1 overflow-x-auto">
//                 <div className="grid grid-cols-8 min-w-[800px] auto-rows-min border-b ">
//                   {/* Header */}

//                   <div className="font-medium text-sm text-gray-600 p-2 left-0 border-b border-r"> 
//                     {/* blank */}
//                   </div>

//                   {weekDates.map((date, index) => (
//                     <div key={index} className="left-0 border-b border-r border-t font-medium text-sm text-gray-600 p-2 text-center">
//                       <div>{weekDays[index]}</div>
//                       <div className="text-xs text-gray-500">{date.getDate()}</div>
//                     </div>
//                   ))}
                  
//                   {/* EMPLOYEE ROWS */}
//                   {filteredEmployee.map((employee) => (
//                     <div key={employee.id} className="contents">
//                       <div className="left-0 border-l border-b border-r bg-white p-3 flex items-center gap-2">
//                         <Avatar className="h-8 w-8">
//                           <AvatarImage src={employee.avatar_url || " " } alt={employee.name} />
//                           <AvatarFallback className="text-gray-400">{employee.name[0]}</AvatarFallback>
//                         </Avatar>
//                         <div className="hidden md:flex flex-col p-2 text-xs">
//                            <p> {employee.name} </p>
//                            <span className="w-4 h-4 text-xs text-gray-500"> {employee.department}</span>
//                         </div>
//                       </div>

//                       {/* Dates per week */}
//                       {weekDates.map((date, dateIndex) => {
//                         const shifts = getShiftForDateAndEmployee(employee.id, date)
//                         return (
//                           <div
//                             key={dateIndex}
//                             className="flex items-center justify-center border-b border-r cursor-pointer hover:bg-gray-100"
//                             // onClick={() =>  handleCellClick(employee, date, shifts[0])  } // Make cell clickable
//                           >
//                             {shifts.map((s, i) =>{ 
//                               return (
//                                 <ShiftCard 
//                                   key={i} time={s.start_time} 
//                                   shift={ (s.shift_type?.name) ? s.shift_type?.name : " " } 
//                                   color={shiftCardColor(s.status)} 
//                                   className="mb-2 last:mb-0" 
//                                 />

//                               )})
//                             }
//                             {shifts.length === 0 && (
//                               <div className="text-xs text-gray-400 text-center py-4">No shifts</div>
//                             )}
//                           </div>
//                         )
//                       })}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>          
//         </main>
//       </div>
//   )
// }
