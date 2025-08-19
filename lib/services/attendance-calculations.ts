export function calculateAttendanceMetrics(
  timeIn: string,
  timeOut: string | null,
  date: string
): {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  sundayHours: number;
  overnightHours: number;
  isSunday: boolean;
  isOvernight: boolean;
  isIncomplete: boolean;
} {
  const dateObj = new Date(date)
  const isSunday = dateObj.getDay() === 0
  
  if (!timeOut) {
    return {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      sundayHours: 0,
      overnightHours: 0,
      isSunday,
      isOvernight: false,
      isIncomplete: true
    }
  }

  // Calculate total hours including overnight shifts
  let totalHours: number
  const timeInDate = new Date(`${date}T${timeIn}`)
  let timeOutDate = new Date(`${date}T${timeOut}`)
  
  // Handle overnight shifts
  const isOvernight = timeOut < timeIn
  if (isOvernight) {
    timeOutDate.setDate(timeOutDate.getDate() + 1)
  }
  
  totalHours = (timeOutDate.getTime() - timeInDate.getTime()) / (1000 * 60 * 60)
  
  // Calculate regular hours (max 8 per day)
  const regularHours = Math.min(totalHours, 8)
  
  // Calculate overtime hours
  const overtimeHours = Math.max(totalHours - 8, 0)
  
  // Sunday hours calculation
  const sundayHours = isSunday ? totalHours : 0
  
  // Overnight hours calculation
  const overnightHours = isOvernight ? totalHours : 0

  return {
    totalHours,
    regularHours,
    overtimeHours,
    sundayHours,
    overnightHours,
    isSunday,
    isOvernight,
    isIncomplete: false
  }
}