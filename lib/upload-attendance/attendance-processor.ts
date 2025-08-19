// lib/processors/attendance-processor.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { format, parse, isValid, differenceInMinutes } from 'date-fns';

import { reconcileEmployeeAfterAttendance } from '../services/schedule-reconciliation';
import { ParsedRecord } from '@/lib/upload-attendance/file-parser';

export interface AttendanceProcessResult {
  recordsInserted: number;
  duplicatesSkipped: number;
  errors: Array<{ row: number; error: string }>;
}

export interface AttendanceRecord {
  employee_id: string;
  user_id: string;
  date?: string;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  created_at?: string;
}

// Configuration
const DUPLICATE_TOLERANCE_MINUTES = 5;
const BATCH_SIZE = 500;

/**
 * Process attendance records with duplicate detection and batch processing
 */
export async function processAttendanceRecords(
  records: ParsedRecord[],
  supabase: SupabaseClient,
  employeeMap: Map<string, string>
): Promise<AttendanceProcessResult> {
  const result: AttendanceProcessResult = {
    recordsInserted: 0,
    duplicatesSkipped: 0,
    errors: []
  };

  console.log(`Processing ${records.length} attendance records`);

  // Filter records that have valid employee mappings
  const validRecords = records.filter(record => {
    if (!employeeMap.has(record.employeeId)) {
      result.errors.push({
        row: record.originalRow,
        error: `Employee ${record.employeeId} not found in employee mapping`
      });
      return false;
    }
    return true;
  });

  console.log(`${validRecords.length} records have valid employee mappings`);

  // Group records by employee and date for efficient duplicate checking
  const recordGroups = groupRecordsByEmployeeAndDate(validRecords);

  // Process each group
  for (const [groupKey, groupRecords] of recordGroups) {
    await processRecordGroup(groupKey, groupRecords, supabase, employeeMap, result);
  }

  console.log(`Attendance processing complete: ${result.recordsInserted} inserted, ${result.duplicatesSkipped} duplicates skipped`);
  return result;
}

/**
 * Group records by employee and date for efficient processing
 */
function groupRecordsByEmployeeAndDate(records: ParsedRecord[]): Map<string, ParsedRecord[]> {
  const groups = new Map<string, ParsedRecord[]>();

  for (const record of records) {
    const key = `${record.employeeId}_${record.date}`;
    
    if (groups.has(key)) {
      groups.get(key)!.push(record);
    } else {
      groups.set(key, [record]);
    }
  }

  return groups;
}

/**
 * Process a group of records for the same employee and date
 */
async function processRecordGroup(
  groupKey: string,
  records: ParsedRecord[],
  supabase: SupabaseClient,
  employeeMap: Map<string, string>,
  result: AttendanceProcessResult
) {
  try {
    const [employeeId, date] = groupKey.split('_');
    const employeeUuid = employeeMap.get(employeeId)!;

    const { data: existingRecords, error: fetchError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', employeeUuid)

    if (fetchError) {
      console.error('Error fetching existing records:', fetchError);
      records.forEach(record => {
        result.errors.push({
          row: record.originalRow,
          error: `Failed to check for duplicates: ${fetchError.message}`
        });
      });
      return;
    }

    // Process each record in the group
    const newRecords: AttendanceRecord[] = [];

    for (const record of records) {
      try {
        const processResult = await processIndividualRecord(
          record,
          employeeUuid,
          existingRecords || [],
          newRecords
        );

        if (processResult.isDuplicate) {
          result.duplicatesSkipped++;
        } else if (processResult.attendanceRecord) {
          newRecords.push(processResult.attendanceRecord);
        }

        if (processResult.error) {
          result.errors.push({
            row: record.originalRow,
            error: processResult.error
          });
        }
      } catch (error) {
        result.errors.push({
          row: record.originalRow,
          error: `Record processing failed: ${error.message}`
        });
      }
    }

    // Insert new records in batches
    if (newRecords.length > 0) {
      await insertAttendanceRecords(newRecords, supabase, result);
    }

  } catch (error) {
    console.error(`Group processing error for ${groupKey}:`, error);
    records.forEach(record => {
      result.errors.push({
        row: record.originalRow,
        error: `Group processing failed: ${error.message}`
      });
    });
  }
}

/**
 * Process an individual attendance record
 */
async function processIndividualRecord(
  record: ParsedRecord,
  employeeUuid: string,
  existingRecords: any[],
  pendingRecords: AttendanceRecord[]
): Promise<{
  isDuplicate: boolean;
  attendanceRecord?: AttendanceRecord;
  error?: string;
}> {
  try {
    // Validate required fields
    if (!record.employeeId) {
      return { isDuplicate: false, error: 'Employee Id is required' };
    }

    if (!record.timeIn && !record.timeOut) {
      return { isDuplicate: false, error: 'At least one time (in or out) is required' };
    }

    // Build attendance record
    const attendanceRecord: AttendanceRecord = {
      employee_id: employeeUuid,
      user_id: record.employeeId,
      date: record.date,
      notes: `Uploaded from file at ${new Date().toISOString()}`
    };

    // Process check-in time
    if (record.timeIn) {
      const checkInTime = buildDateTime(record.date, record.timeIn);
      if (!checkInTime) {
        return { isDuplicate: false, error: `Invalid check-in time: ${record.timeIn}` };
      }
      attendanceRecord.check_in_time = checkInTime;
    }

    // Process check-out time
    if (record.timeOut) {
      const checkOutTime = buildDateTime(record.date, record.timeOut);
      if (!checkOutTime) {
        return { isDuplicate: false, error: `Invalid check-out time: ${record.timeOut}` };
      }
      attendanceRecord.check_out_time = checkOutTime;
    }

    // Check for duplicates
    const isDuplicate = checkForDuplicates(
      attendanceRecord,
      existingRecords,
      pendingRecords
    );

    if (isDuplicate) {
      return { isDuplicate: true };
    }

    return { isDuplicate: false, attendanceRecord };

  } catch (error) {
    return { isDuplicate: false, error: `Processing error: ${error.message}` };
  }
}

/**
 * Build full datetime string from date and time
 */
function buildDateTime(date: string, time: string): string | null {
  try {
    if (!date || !time) return null;

    // Handle different time formats
    let normalizedTime = time;
    
    // Add seconds if missing
    if (!/:\d{2}$/.test(normalizedTime)) {
      normalizedTime += ':00';
    }

    const dateTimeStr = `${date} ${normalizedTime}`;
    
    // Validate the combined datetime
    const parsedDate = new Date(dateTimeStr);
    if (!isValid(parsedDate)) {
      throw new Error(`Invalid datetime: ${dateTimeStr}`);
    }

    return format(parsedDate, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    console.error('DateTime build error:', error);
    return null;
  }
}

/**
 * Check if record is a duplicate
 */
function checkForDuplicates(
  newRecord: AttendanceRecord,
  existingRecords: any[],
  pendingRecords: AttendanceRecord[]
): boolean {
  const allRecords = [...existingRecords, ...pendingRecords];

  for (const existing of allRecords) {
    // Check for exact match
    if (newRecord.check_in_time && existing.check_in_time ) {
      if (newRecord.check_in_time === existing.check_in_time) {
        return true; // Exact duplicate
      }

      // Check within tolerance window
      if (DUPLICATE_TOLERANCE_MINUTES > 0) {
        const newTime = new Date(newRecord.check_in_time);
        const existingTime = new Date(existing.check_in_time);
        const diffMinutes = Math.abs(differenceInMinutes(newTime, existingTime));
        
        if (diffMinutes <= DUPLICATE_TOLERANCE_MINUTES) {
          return true; // Within tolerance window
        }
      }
    }

    // Check check-out times similarly
    if (newRecord.check_out_time && existing.check_out_time) {
      if (newRecord.check_out_time === existing.check_out_time) {
        return true;
      }

      if (DUPLICATE_TOLERANCE_MINUTES > 0) {
        const newTime = new Date(newRecord.check_out_time);
        const existingTime = new Date(existing.check_out_time);
        const diffMinutes = Math.abs(differenceInMinutes(newTime, existingTime));
        
        if (diffMinutes <= DUPLICATE_TOLERANCE_MINUTES) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Insert attendance records in batches
 */
async function insertAttendanceRecords(
  records: AttendanceRecord[],
  supabase: SupabaseClient,
  result: AttendanceProcessResult
) {
  try {
    console.log(`Inserting ${records.length} attendance records`);

    // Process in batches for better performance
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      
      const { data, error } = await supabase
        .from('attendance_logs')
        .insert(batch)
        .select('id');

      if (error) {
        console.error('Batch insert error:', error);
        
        // Try individual inserts for this batch
        await handleBatchInsertError(batch, supabase, result);
      } else {

        result.recordsInserted += data?.length || batch.length;

        const updateSchedule = await reconcileEmployeeAfterAttendance(
          records[i].employee_id, 
          records[i].date,
          records[i]?.check_in_time,
          records[i]?.check_out_time
        );
        console.log(updateSchedule);
      }
    }

    console.log(`Successfully inserted attendance records`);

  } catch (error) {
    console.error('Attendance insert error:', error);
    throw error;
  }
}

/**
 * Handle batch insert errors by trying individual inserts
 */
async function handleBatchInsertError(
  batch: AttendanceRecord[],
  supabase: SupabaseClient,
  result: AttendanceProcessResult
) {
  console.log('Handling batch insert error with individual inserts');

  for (const record of batch) {
    try {
      const { error: individualError } = await supabase
        .from('attendance_logs')
        .insert([record]);

      if (individualError) {
        result.errors.push({
          row: 0, // We don't have the original row number here
          error: `Failed to insert attendance record: ${individualError.message}`
        });
      } else {
        result.recordsInserted++;
      }
    } catch (error) {
      result.errors.push({
        row: 0,
        error: `Individual insert failed: ${error.message}`
      });
    }
  }
}

/**
 * Validate attendance record
 */
export function validateAttendanceRecord(record: ParsedRecord): string | null {
  if (!record.employeeId) {
    return 'Employee ID is required';
  }

  if (!record.date) {
    return 'Date is required';
  }

  if (!record.timeIn && !record.timeOut) {
    return 'At least one time (check-in or check-out) is required';
  }

  // Validate date format
  try {
    const parsedDate = new Date(record.date);
    if (!isValid(parsedDate)) {
      return 'Invalid date format';
    }
  } catch {
    return 'Invalid date format';
  }

  // Validate time formats
  if (record.timeIn) {
    const checkInTime = buildDateTime(record.date, record.timeIn);
    if (!checkInTime) {
      return `Invalid check-in time format: ${record.timeIn}`;
    }
  }

  if (record.timeOut) {
    const checkOutTime = buildDateTime(record.date, record.timeOut);
    if (!checkOutTime) {
      return `Invalid check-out time format: ${record.timeOut}`;
    }
  }

  return null;
}

/**
 * Get duplicate tolerance configuration
 */
export function getDuplicateToleranceMinutes(): number {
  return DUPLICATE_TOLERANCE_MINUTES;
}