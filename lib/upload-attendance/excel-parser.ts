import { EmployeeTimeRecord, EmployeeTimeLogs } from '@/types';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

/**
 * Parse and format employee time logs from a file path
 * Finds columns dynamically by header name and includes Day column.
 */
export async function parseExcel(filePath: string): Promise<EmployeeTimeRecord> {
  // 1. Read file buffer from disk
  const fileBuffer = readFileSync(filePath);

  // 2. Parse workbook
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // 3. Get first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 4. Extract start & end dates (from B2, B3)
  const startDate = sheet['B2']?.v || null;
  const endDate = sheet['B3']?.v || null;

  // 5. Convert sheet to 2D array
  const sheetData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  if (sheetData.length < 6) {
    throw new Error('Excel file does not contain enough rows.');
  }

  // 6. Read header row (assuming row 5)
  const headerRow = sheetData[4].map((h: any) => String(h || '').trim());

  // 7. Find column indexes dynamically
  const empIdCol = headerRow.indexOf('Employee No.');
  const empNameCol = headerRow.indexOf('Employee Name');
  const dateCol = headerRow.indexOf('Date');
  const dayCol = headerRow.indexOf('Day');
  const timeInCol = headerRow.indexOf('IN'); // first IN
  const timeOutCol = headerRow.lastIndexOf('OUT'); // last OUT
  let currentEmpId: string = "";
  let currentEmpName: string = "";

  if (
    dateCol === -1 ||
    dayCol === -1 ||
    timeInCol === -1 ||
    timeOutCol === -1
  ) {
    throw new Error('Required columns not found in Excel file.');
  }

  // 8. Extract data rows after header
  const rawEmployeeRows = sheetData.slice(5);

  // 9. Format into EmployeeTimeLogs[]
  const logs: EmployeeTimeLogs[] = [];

  for (const row of rawEmployeeRows) {
    if (!row || row.length === 0) continue;

    const empId = row[empIdCol];
    const empName = row[empNameCol];
    const date = row[dateCol];
    const day = row[dayCol];
    const timeIn = row[timeInCol];
    const timeOut = row[timeOutCol];

    if (empId && empName) {
      // New employee → update context
      currentEmpId = String(empId).trim();
      currentEmpName = String(empName).trim();
    }

    if (!currentEmpId || !currentEmpName) {
      // If ID/name is still missing, skip this row
      continue;
    }

    if (date && (timeIn || timeOut)) {
      logs.push({
        employeeId: String(currentEmpId).trim(),
        employeeName: String(currentEmpName).trim(),
        date: String(date || '').trim(),
        day: String(day || '').trim(),
        timeIn: String(timeIn || '').trim(),
        timeOut: timeOut ? String(timeOut).trim() : undefined,
      } as any); // using "as any" if your type doesn't have 'day' yet
    }
  }

  // 10. Return the structured record

  return {
    startDate,
    endDate,
    //@ts-ignore
    logs,
  };
}
