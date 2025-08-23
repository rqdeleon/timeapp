import { NextRequest, NextResponse } from 'next/server'
import { getAttendance } from '@/lib/report/getAttendance'
import { createClient } from '@/lib/utils/supabase/server'

// Helper function to convert data to CSV
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  return csvContent
}

// Helper function to convert data to Excel format (TSV)
function arrayToExcel(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const excelContent = [
    headers.join('\t'),
    ...data.map(row => 
      headers.map(header => row[header]).join('\t')
    )
  ].join('\n')
  
  return excelContent
}

// Enhanced PDF content generation
function generatePDFContent(data: any[], startDate: string, endDate: string): string {
  const totalEmployees = data.length
  const totalScheduledHours = data.reduce((sum, emp) => sum + parseFloat(emp['Scheduled Hours']), 0)
  const totalWorkedHours = data.reduce((sum, emp) => sum + parseFloat(emp['Worked Hours']), 0)
  const totalOvertimeHours = data.reduce((sum, emp) => sum + parseFloat(emp['Overtime Hours']), 0)
  const totalLateArrivals = data.reduce((sum, emp) => sum + parseInt(emp['Late Arrivals']), 0)
  const totalAbsences = data.reduce((sum, emp) => sum + parseInt(emp['Absences']), 0)
  
  const content = [
    'ENHANCED ATTENDANCE REPORT',
    '==========================',
    '',
    `Report Period: ${startDate} to ${endDate}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'SUMMARY STATISTICS:',
    '-------------------',
    `Total Employees: ${totalEmployees}`,
    `Total Scheduled Hours: ${totalScheduledHours.toFixed(1)}`,
    `Total Worked Hours: ${totalWorkedHours.toFixed(1)}`,
    `Total Overtime Hours: ${totalOvertimeHours.toFixed(1)}`,
    `Attendance Rate: ${totalScheduledHours > 0 ? ((totalWorkedHours / totalScheduledHours) * 100).toFixed(1) : 0}%`,
    `Total Late Arrivals: ${totalLateArrivals}`,
    `Total Absences: ${totalAbsences}`,
    `Average Hours per Employee: ${totalEmployees > 0 ? (totalWorkedHours / totalEmployees).toFixed(1) : 0}`,
    '',
    'EMPLOYEE DETAILS:',
    '-----------------',
    ...data.map(emp => [
      `Name: ${emp['Name']}`,
      `Department: ${emp['Department']}`,
      `Scheduled Hours: ${emp['Scheduled Hours']}`,
      `Worked Hours: ${emp['Worked Hours']}`,
      `Overtime Hours: ${emp['Overtime Hours']}`,
      `Days Worked: ${emp['Days Worked']}`,
      `Scheduled Days: ${emp['Scheduled Days']}`,
      `Unscheduled Work Days: ${emp['Unscheduled Work Days']}`,
      `Late Arrivals: ${emp['Late Arrivals']}`,
      `Absences: ${emp['Absences']}`,
      `Attendance Rate: ${emp['Attendance Rate']}`,
      '---'
    ].join('\n'))
  ].join('\n')
  
  return content
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const department = searchParams.get('department')
    const format = searchParams.get('format') || 'csv'

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
    }

    // Fetch attendance data
    const attendanceData = await getAttendance(
      startDate,
      endDate,
      department || undefined
    )

    if (!attendanceData || attendanceData.length === 0) {
      return NextResponse.json({ error: 'No data found for the specified criteria' }, { status: 404 })
    }

    // Prepare enhanced export data with all new fields
    const exportData = attendanceData.map(emp => ({
      'Employee ID': emp.empId,
      'Name': emp.name,
      'Department': emp.department,
      'Scheduled Hours': emp.totalScheduledHours.toFixed(1),
      'Worked Hours': emp.totalWorkedHours.toFixed(1),
      'Overtime Hours': emp.overtimeHours.toFixed(1),
      'Scheduled Days': emp.scheduledDays,
      'Days Worked': emp.workedDays,
      'Unscheduled Work Days': emp.unscheduledWorkDays,
      'Late Arrivals': emp.lateCount,
      'Absences': emp.absences,
      'Attendance Rate': emp.totalScheduledHours > 0 
        ? `${((emp.totalWorkedHours / emp.totalScheduledHours) * 100).toFixed(1)}%`
        : 'N/A',
      'Productivity Rate': emp.scheduledDays > 0
        ? `${((emp.workedDays / emp.scheduledDays) * 100).toFixed(1)}%`
        : 'N/A',
      'Avg Hours per Worked Day': emp.workedDays > 0
        ? (emp.totalWorkedHours / emp.workedDays).toFixed(1)
        : '0',
      'Overtime Rate': emp.totalWorkedHours > 0
        ? `${((emp.overtimeHours / emp.totalWorkedHours) * 100).toFixed(1)}%`
        : '0%'
    }))

    let content: string
    let contentType: string
    let filename: string

    switch (format.toLowerCase()) {
      case 'csv':
        content = arrayToCSV(exportData)
        contentType = 'text/csv'
        filename = `enhanced-attendance-report-${startDate}-to-${endDate}.csv`
        break
        
      case 'excel':
        content = arrayToExcel(exportData)
        contentType = 'application/vnd.ms-excel'
        filename = `enhanced-attendance-report-${startDate}-to-${endDate}.xlsx`
        break
        
      case 'pdf':
        content = generatePDFContent(exportData, startDate, endDate)
        contentType = 'text/plain' // Simplified - use proper PDF library for actual PDF
        filename = `enhanced-attendance-report-${startDate}-to-${endDate}.txt`
        break
        
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}