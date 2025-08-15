import { EmployeeTimeLogs } from '@/types';

export function parseCSV(csvContent: string): EmployeeTimeLogs[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const records: EmployeeTimeLogs[] = [];
  
  // Skip header rows and find the actual data
  let dataStartIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('employee') || line.includes('name') || line.includes('id')) {
      dataStartIndex = i + 1;
      break;
    }
  }
  
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle both comma and tab delimited files
    const columns = line.includes('\t') ? line.split('\t') : line.split(',');
    
    // Clean up columns
    const cleanColumns = columns.map(col => col.replace(/"/g, '').trim());
    
    // Skip if not enough columns
    if (cleanColumns.length < 4) continue;
    
    // Try to parse the record based on common CSV formats
    const record = parseEmployeeRecord(cleanColumns);
    if (record) {
      records.push(record);
    }
  }
  
  return records;
}

function parseEmployeeRecord(columns: string[]): EmployeeTimeLogs | null {
  try {
    // Common formats:
    // [Employee Name, Employee ID, Date, Time In, Time Out]
    // [Employee ID, Employee Name, Date, Time In, Time Out]
    // [Date, Employee Name, Employee ID, Time In, Time Out]
    
    let employeeName = '';
    let employeeId = '';
    let date = '';
    let timeIn = '';
    let timeOut = '';
    
    // Try to identify columns by content
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      
      // Check if it's a date (various formats)
      if (isDateString(col)) {
        date = col;
      }
      // Check if it's a time (HH:MM format)
      else if (isTimeString(col)) {
        if (!timeIn) {
          timeIn = col;
        } else if (!timeOut) {
          timeOut = col;
        }
      }
      // Check if it's numeric (likely employee ID)
      else if (/^\d+$/.test(col)) {
        employeeId = col;
      }
      // Otherwise, it's likely a name
      else if (col && !employeeName) {
        employeeName = col;
      }
    }
    
    // Validate required fields
    if (!employeeName || !employeeId || !date || !timeIn) {
      return null;
    }
    
    return {
      employeeName,
      employeeId,
      date: standardizeDate(date),
      day: " ",
      timeIn: standardizeTime(timeIn),
      timeOut: timeOut ? standardizeTime(timeOut) : undefined,
    };
  } catch (error) {
    console.error('Error parsing employee record:', error);
    return null;
  }
}

function isDateString(str: string): boolean {
  // Check for various date formats
  const datePatterns = [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,  // MM/DD/YYYY or M/D/YYYY
    /^\d{4}-\d{1,2}-\d{1,2}$/,    // YYYY-MM-DD
    /^\d{1,2}-\d{1,2}-\d{4}$/,    // MM-DD-YYYY
  ];
  
  return datePatterns.some(pattern => pattern.test(str));
}

function isTimeString(str: string): boolean {
  // Check for time formats like HH:MM, H:MM AM/PM
  const timePatterns = [
    /^\d{1,2}:\d{2}$/,           // HH:MM
    /^\d{1,2}:\d{2}\s?(AM|PM)$/i, // HH:MM AM/PM
  ];
  
  return timePatterns.some(pattern => pattern.test(str));
}

function standardizeDate(dateStr: string): string {
  // Convert various date formats to YYYY-MM-DD
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return date.toISOString().split('T')[0];
}

function standardizeTime(timeStr: string): string {
  // Convert time to 24-hour format
  let time = timeStr.trim();
  
  // Handle AM/PM format
  const ampmMatch = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1]);
    const minutes = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // Already in 24-hour format
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }
  
  throw new Error(`Invalid time format: ${timeStr}`);
}
