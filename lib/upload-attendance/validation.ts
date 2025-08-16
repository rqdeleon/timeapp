// lib/utils/validation.ts
import { ParsedRecord } from '@/lib/upload-attendance/file-parser';
import { validateEmployeeRecord } from '@/lib/upload-attendance/employee-processor';
import { validateAttendanceRecord } from '@/lib/upload-attendance/attendance-processor';

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
  summary: {
    totalRecords: number;
    validRecords: number;
    errorRecords: number;
    warningRecords: number;
  };
}

/**
 * Validate upload data comprehensively
 */
export async function validateUploadData(records: ParsedRecord[]): Promise<ValidationResult> {
  const errors: Array<{ row: number; error: string }> = [];
  const warnings: Array<{ row: number; warning: string }> = [];

  console.log(`Validating ${records.length} records`);

  for (const record of records) {
    const rowNumber = record.originalRow;

    try {
      // Validate employee data
      const employeeError = validateEmployeeRecord(record.employeeId, record.employeeName);
      if (employeeError) {
        errors.push({ row: rowNumber, error: employeeError });
        continue; // Skip further validation if employee data is invalid
      }

      // Validate attendance data
      const attendanceError = validateAttendanceRecord(record);
      if (attendanceError) {
        errors.push({ row: rowNumber, error: attendanceError });
        continue;
      }

      // Additional business logic validations
      const businessValidation = validateBusinessRules(record);
      if (businessValidation.error) {
        errors.push({ row: rowNumber, error: businessValidation.error });
      }
      if (businessValidation.warnings) {
        businessValidation.warnings.forEach(warning => {
          warnings.push({ row: rowNumber, warning });
        });
      }

    } catch (validationError) {
      errors.push({
        row: rowNumber,
        error: `Validation failed: ${validationError.message}`
      });
    }
  }

  const validRecords = records.length - errors.length;

  console.log(`Validation complete: ${validRecords} valid, ${errors.length} errors, ${warnings.length} warnings`);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRecords: records.length,
      validRecords,
      errorRecords: errors.length,
      warningRecords: warnings.length
    }
  };
}

/**
 * Validate business rules
 */
function validateBusinessRules(record: ParsedRecord): {
  error?: string;
  warnings?: string[];
} {
  const warnings: string[] = [];

  try {
    // 1. Date validation - not in the future
    const recordDate = new Date(record.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (recordDate > today) {
      return { error: 'Date cannot be in the future' };
    }

    // 2. Date not too old (configurable, e.g., 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (recordDate < oneYearAgo) {
      warnings.push('Date is more than one year old');
    }

    // 3. Time validation
    if (record.timeIn && record.timeOut) {
      const timeIn = parseTimeString(record.timeIn);
      const timeOut = parseTimeString(record.timeOut);

      if (timeIn && timeOut) {
        // Check if time out is after time in
        if (timeOut <= timeIn) {
          // Could be next day checkout, add warning
          warnings.push('Check-out time is before or same as check-in time');
        }

        // Check for reasonable work hours (e.g., max 24 hours)
        const workMinutes = calculateWorkMinutes(timeIn, timeOut);
        if (workMinutes > 24 * 60) { // More than 24 hours
          warnings.push('Work duration exceeds 24 hours');
        } else if (workMinutes < 30) { // Less than 30 minutes
          warnings.push('Work duration less than 30 minutes');
        }
      }
    }

    // 4. Time format validation
    if (record.timeIn && !isValidTimeFormat(record.timeIn)) {
      return { error: `Invalid time format for check-in: ${record.timeIn}` };
    }

    if (record.timeOut && !isValidTimeFormat(record.timeOut)) {
      return { error: `Invalid time format for check-out: ${record.timeOut}` };
    }

    // 5. Employee ID format validation
    if (!isValidEmployeeIdFormat(record.employeeId)) {
      return { error: 'Employee ID format is invalid' };
    }

    // 6. Name validation
    if (record.employeeName && !isValidNameFormat(record.employeeName)) {
      warnings.push('Employee name contains unusual characters');
    }

    return { warnings: warnings.length > 0 ? warnings : undefined };

  } catch (error) {
    return { error: `Business rule validation failed: ${error.message}` };
  }
}

/**
 * Parse time string to minutes since midnight
 */
function parseTimeString(timeStr: string): number | null {
  try {
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!timeMatch) return null;

    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    return hours * 60 + minutes;
  } catch {
    return null;
  }
}

/**
 * Calculate work duration in minutes
 */
function calculateWorkMinutes(timeIn: number, timeOut: number): number {
  if (timeOut >= timeIn) {
    return timeOut - timeIn;
  } else {
    // Assuming next day checkout
    return (24 * 60) - timeIn + timeOut;
  }
}

/**
 * Validate time format
 */
function isValidTimeFormat(timeStr: string): boolean {
  const timePatterns = [
    /^\d{1,2}:\d{2}$/,           // HH:MM
    /^\d{1,2}:\d{2}:\d{2}$/,     // HH:MM:SS
  ];

  if (!timePatterns.some(pattern => pattern.test(timeStr))) {
    return false;
  }

  const parsed = parseTimeString(timeStr);
  return parsed !== null;
}

/**
 * Validate employee ID format
 */
function isValidEmployeeIdFormat(employeeId: string): boolean {
  if (!employeeId || employeeId.trim().length === 0) {
    return false;
  }

  // Basic format validation - adjust based on your requirements
  const trimmed = employeeId.trim();
  
  // Check length
  if (trimmed.length < 1 || trimmed.length > 50) {
    return false;
  }

  // Check for valid characters (alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Validate name format
 */
function isValidNameFormat(name: string): boolean {
  if (!name || name.trim().length === 0) {
    return false;
  }

  const trimmed = name.trim();
  
  // Check length
  if (trimmed.length < 2 || trimmed.length > 255) {
    return false;
  }

  // Allow letters, spaces, hyphens, apostrophes, and dots
  // This is quite permissive for international names
  if (!/^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff\s\-'.]+$/.test(trimmed)) {
    return false;
  }

  // Check for reasonable number of consecutive spaces/special chars
  if (/\s{3,}|[-']{2,}|\.{2,}/.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Validate file content before processing
 */
export function validateFileContent(
  headers: string[], 
  data: any[][], 
  requiredColumns: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if file has data
  if (!data || data.length === 0) {
    errors.push('File contains no data rows');
    return { isValid: false, errors };
  }

  // Check if headers exist
  if (!headers || headers.length === 0) {
    errors.push('File contains no header row');
    return { isValid: false, errors };
  }

  // Check for empty headers
  const emptyHeaders = headers.filter((header, index) => 
    !header || header.toString().trim().length === 0
  );
  if (emptyHeaders.length > 0) {
    errors.push(`Found ${emptyHeaders.length} empty column header(s)`);
  }

  // Check for duplicate headers
  const headerCounts = new Map<string, number>();
  headers.forEach(header => {
    const trimmed = header.toString().trim().toLowerCase();
    if (trimmed) {
      headerCounts.set(trimmed, (headerCounts.get(trimmed) || 0) + 1);
    }
  });

  const duplicates = Array.from(headerCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([header, _]) => header);

  if (duplicates.length > 0) {
    errors.push(`Duplicate column headers found: ${duplicates.join(', ')}`);
  }

  // Check data consistency
  const headerCount = headers.length;
  let inconsistentRows = 0;

  for (let i = 0; i < Math.min(data.length, 100); i++) { // Check first 100 rows
    if (data[i] && data[i].length !== headerCount) {
      inconsistentRows++;
    }
  }

  if (inconsistentRows > 0) {
    errors.push(`${inconsistentRows} rows have inconsistent number of columns`);
  }

  // Check for mostly empty data
  const sampleSize = Math.min(data.length, 50);
  let emptyRows = 0;

  for (let i = 0; i < sampleSize; i++) {
    const row = data[i];
    if (!row || row.every(cell => !cell || cell.toString().trim().length === 0)) {
      emptyRows++;
    }
  }

  if (emptyRows > sampleSize * 0.8) {
    errors.push('File appears to contain mostly empty rows');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize record data
 */
export function sanitizeRecord(record: ParsedRecord): ParsedRecord {
  return {
    ...record,
    employeeId: record.employeeId?.toString().trim() || '',
    employeeName: record.employeeName?.toString().trim() || '',
    date: record.date?.toString().trim() || '',
    timeIn: record.timeIn?.toString().trim() || undefined,
    timeOut: record.timeOut?.toString().trim() || undefined,
    department: record.department?.toString().trim() || undefined
  };
}

/**
 * Check if record has minimum required data
 */
export function hasMinimumData(record: ParsedRecord): boolean {
  return !!(
    record.employeeId && 
    record.employeeId.trim().length > 0 &&
    record.date && 
    record.date.trim().length > 0 &&
    (record.timeIn || record.timeOut)
  );
}