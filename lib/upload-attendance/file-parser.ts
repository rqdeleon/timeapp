// lib/parsers/file-parser.ts
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import { readFileSync } from 'fs';
import { parse, format, isValid } from 'date-fns';

export interface ParsedRecord {
  employeeId: string;
  employeeName: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  department?: string;
  originalRow: number;
}

export interface ParseResult {
  records: ParsedRecord[];
  totalRows: number;
  headers: string[];
  metadata: {
    fileType: string;
    processingTime: number;
    startDate?: string;
    endDate?: string;
  };
}

export interface ColumnMapping {
  employeeId?: string;
  name?: string;
  date?: string;
  timeIn?: string;
  timeOut?: string;
  department?: string;
}

/**
 * Parse file with intelligent format detection and column mapping
 */
export async function parseFile(filePath: string, columnMapping: ColumnMapping): Promise<ParseResult> {
  const startTime = Date.now();
  
  try {
    const fileBuffer = readFileSync(filePath);
    const fileExtension = filePath.toLowerCase().split('.').pop();
    
    let parsedData: any;
    let fileType: string;

    // Determine file type and parse accordingly
    if (fileExtension === 'csv' || fileExtension === 'tsv') {
      fileType = fileExtension.toUpperCase();
      parsedData = parseCSVFile(fileBuffer, fileExtension === 'tsv' ? '\t' : ',');
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      fileType = 'XLSX';
      parsedData = parseExcelFile(fileBuffer);
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}`);
    }

    if (!parsedData.headers || parsedData.headers.length === 0) {
      throw new Error('No headers found in file');
    }

    // Map columns and extract records
    const records = extractRecords(parsedData, columnMapping);
    
    return {
      records,
      totalRows: parsedData.data.length,
      headers: parsedData.headers,
      metadata: {
        fileType,
        processingTime: Date.now() - startTime,
        startDate: extractMetadataDate(parsedData, 'start'),
        endDate: extractMetadataDate(parsedData, 'end')
      }
    };

  } catch (error) {
    console.error('File parsing error:', error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

/**
 * Parse CSV/TSV files using PapaParse
 */
function parseCSVFile(fileBuffer: Buffer, delimiter: string = ',') {
  const csvContent = fileBuffer.toString('utf-8');
  
  const parseResult = Papa.parse(csvContent, {
    delimiter,
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header: string) => header.trim(),
  });

  if (parseResult.errors.length > 0) {
    console.warn('CSV parsing warnings:', parseResult.errors);
  }

  const data = parseResult.data as string[][];
  if (data.length < 2) {
    throw new Error('File must contain at least a header row and one data row');
  }

  // Find header row (look for row with employee/name/id indicators)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i].map(cell => cell?.toLowerCase?.() || '');
    if (row.some(cell => 
      cell.includes('employee no') || 
      cell.includes('employee name') || 
      cell.includes('date') ||
      cell.includes('in') ||
      cell.includes('out')
    )) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = data[headerRowIndex].map(h => String(h || '').trim());
  const dataRows = data.slice(headerRowIndex + 1);

  return { headers, data: dataRows };
}

/**
 * Parse Excel files using XLSX
 */
function parseExcelFile(fileBuffer: Buffer) {
  const workbook = XLSX.read(fileBuffer, { 
    type: 'buffer',
    cellDates: true,
    dateNF: 'yyyy-mm-dd'
  });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to 2D array
  const sheetData = XLSX.utils.sheet_to_json<any[]>(sheet, { 
    header: 1,
    raw: false,
    dateNF: 'yyyy-mm-dd'
  });

  if (sheetData.length < 2) {
    throw new Error('Excel file must contain at least a header row and one data row');
  }

  // THIS LOGIC IS NOT WORKING PROPERLY
  // let headerRowIndex = 0;
  // for (let i = 0; i < Math.min(10, sheetData.length); i++) {
  //   const row = sheetData[i]?.map(cell => String(cell || '').toLowerCase()) || [];
  //   if (row.some(cell => 
  //     cell.includes('employee no') || 
  //     cell.includes('employee name') || 
  //     cell.includes('date') ||
  //     cell.includes('in') ||
  //     cell.includes('out')
  //   )) {
  //     headerRowIndex = i;
  //     break;
  //   }
  // }
  
  // Extract start & end dates (from B2, B3)
  const startDate = sheet['B2']?.v || null;
  const endDate = sheet['B3']?.v || null;
  const year = format(startDate, 'yyyy')

  // header row must be located on row 5
  const headerRaw = sheetData[4]?.map(h => String(h || '').trim()) || [];
  const headers = headerRaw.filter( val => val);
  const dataRows = sheetData.slice(5);

  return { headers, data: dataRows, year };
}

/**
 * Extract records using column mapping
 */
function extractRecords(parsedData: any, columnMapping: ColumnMapping): ParsedRecord[] {
  const { headers, data, year } = parsedData;
  const records: ParsedRecord[] = [];

  // Create column index mapping
  const colIndices = {
    employeeId: findColumnIndex(headers, columnMapping.employeeId),
    name: findColumnIndex(headers, columnMapping.name),
    date: findColumnIndex(headers, columnMapping.date),
    timeIn: findColumnIndex(headers, columnMapping.timeIn),
    timeOut: findColumnIndex(headers, columnMapping.timeOut),
    department: findColumnIndex(headers, columnMapping.department)
  };

  // Validate required columns
  if (colIndices.employeeId === -1) {
    throw new Error('Employee ID column not found or not mapped');
  }
  if (colIndices.date === -1) {
    throw new Error('Date column not found or not mapped');
  }

  // Track current employee context (for Excel formats where employee appears once)
  let currentEmployeeId = '';
  let currentEmployeeName = '';

  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    if (!row || row.length === 0) continue;

    try {
      // Extract values
      const employeeId = extractCellValue(row, colIndices.employeeId);
      const employeeName = extractCellValue(row, colIndices.name);
      const date = extractCellValue(row, colIndices.date);
      const timeIn = extractCellValue(row, colIndices.timeIn);
      const timeOut = extractCellValue(row, colIndices.timeOut);
      const department = extractCellValue(row, colIndices.department);

      // Update current employee context if new employee data found
      if (employeeId && employeeName) {
        currentEmployeeId = employeeId;
        currentEmployeeName = employeeName;
      }

      // Use current context if employee data missing in this row
      const finalEmployeeId = employeeId || currentEmployeeId;
      const finalEmployeeName = employeeName || currentEmployeeName;

      // Skip rows without essential data
      if (!finalEmployeeId || !date) {
        continue;
      }

      // Skip rows without any time data
      if (!timeIn && !timeOut) {
        continue;
      }

      // Process and validate data
      const processedRecord: ParsedRecord = {
        employeeId: String(finalEmployeeId).trim(),
        employeeName: String(finalEmployeeName || 'Unknown').trim(),
        date: processDateValue(`${year}-${date}`),
        originalRow: rowIndex + 1
      };

      // Process time values
      if (timeIn) {
        processedRecord.timeIn = processTimeValue(timeIn);
      }
      if (timeOut) {
        processedRecord.timeOut = processTimeValue(timeOut);
      }
      if (department) {
        processedRecord.department = String(department).trim();
      }

      records.push(processedRecord);

    } catch (rowError) {
      console.warn(`Error processing row ${rowIndex + 1}:`, rowError.message);
      // Continue processing other rows
    }
  }

  return records;
}

/**
 * Find column index by name
 */
function findColumnIndex(headers: string[], columnName?: string): number {
  if (!columnName) return -1;
  
  const normalizedTarget = columnName.toLowerCase().trim();
  return headers.findIndex(header => 
    header.toLowerCase().trim() === normalizedTarget
  );
}

/**
 * Extract cell value safely
 */
function extractCellValue(row: any[], columnIndex: number): string | null {
  if (columnIndex === -1 || columnIndex >= row.length) {
    return null;
  }
  
  const value = row[columnIndex];
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  return String(value).trim();
}

/**
 * Process date values with multiple format support
 */
function processDateValue(dateValue: string, year?: string): string {
  if (!dateValue) {
    throw new Error('Date value is required');
  }

  // Handle Excel date numbers
  if (/^\d+(\.\d+)?$/.test(dateValue)) {
    const excelDate = XLSX.SSF.parse_date_code(parseFloat(dateValue));
    if (excelDate) {
      return format(new Date(excelDate.y, excelDate.m - 1, excelDate.d), 'yyyy-MM-dd');
    }
  }

  // Common date formats to try
  const dateFormats = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'MM-dd-yyyy',
    'dd-MM-yyyy',
    'M/d/yyyy',
    'd/M/yyyy'
  ];

  for (const formatStr of dateFormats) {
    try {
      const parsed = parse(dateValue, formatStr, new Date());
      if (isValid(parsed)) {
        return format(parsed, 'yyyy-MM-dd');
      }
    } catch {
      // Try next format
    }
  }

  // Try native Date parsing as last resort
  const nativeDate = new Date(dateValue);
  if (isValid(nativeDate)) {
    return format(nativeDate, 'yyyy-MM-dd');
  }

  throw new Error(`Unable to parse date: ${dateValue}`);
}

/**
 * Process time values with multiple format support
 */
function processTimeValue(timeValue: string): string {
  if (!timeValue) return '';

  let time = String(timeValue).trim();

  // Handle Excel time numbers (decimal representation of day fraction)
  if (/^\d*\.\d+$/.test(time)) {
    const timeFloat = parseFloat(time);
    const hours = Math.floor(timeFloat * 24);
    const minutes = Math.floor((timeFloat * 24 * 60) % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

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

  // Handle 24-hour format
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }

  // Handle time without colon (e.g., "0900" -> "09:00")
  const noColonMatch = time.match(/^(\d{3,4})$/);
  if (noColonMatch) {
    const timeStr = noColonMatch[1].padStart(4, '0');
    const hours = timeStr.substring(0, 2);
    const minutes = timeStr.substring(2, 4);
    return `${hours}:${minutes}`;
  }

  throw new Error(`Unable to parse time: ${timeValue}`);
}

/**
 * Extract metadata dates from file (for Excel files with date ranges)
 */
function extractMetadataDate(parsedData: any, type: 'start' | 'end'): string | undefined {
  const { data } = parsedData;
  
  // Look for date patterns in first few rows (common in biometric exports)
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i] || [];
    for (let j = 0; j < Math.min(5, row.length); j++) {
      const cell = String(row[j] || '').trim();
      if (cell.toLowerCase().includes(type) && cell.includes(':')) {
        const datePart = cell.split(':')[1]?.trim();
        if (datePart) {
          try {
            return processDateValue(datePart);
          } catch {
            // Continue searching
          }
        }
      }
    }
  }
  
  return undefined;
}