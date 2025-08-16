// lib/processors/employee-processor.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { ParsedRecord } from '@/lib/upload-attendance/file-parser';

export interface EmployeeProcessResult {
  newEmployeesCreated: number;
  employeesMatched: number;
  employeeMap: Map<string, string>; // employeeId -> uuid
  errors: Array<{ row: number; error: string }>;
}

export interface EmployeeRecord {
  id?: string;
  user_id: string;
  badge_id?: string;
  name: string;
  department?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

// Configuration - can be moved to environment variables
const EMPLOYEE_MATCH_STRATEGY: 'badge_id' | 'user_id' | 'name_dob' = 'user_id';
const AUTO_CREATE_EMPLOYEES = true;

/**
 * Process employees: match existing or create new employees
 */
export async function processEmployees(
  records: ParsedRecord[],
  supabase: SupabaseClient
): Promise<EmployeeProcessResult> {
  const result: EmployeeProcessResult = {
    newEmployeesCreated: 0,
    employeesMatched: 0,
    employeeMap: new Map(),
    errors: []
  };

  // Extract unique employees from records
  const uniqueEmployees = extractUniqueEmployees(records);
  console.log(`Processing ${uniqueEmployees.length} unique employees`);

  // Process employees in batches for better performance
  const batchSize = 50;
  for (let i = 0; i < uniqueEmployees.length; i += batchSize) {
    const batch = uniqueEmployees.slice(i, i + batchSize);
    await processBatch(batch, supabase, result);
  }

  console.log(`Employee processing complete: ${result.newEmployeesCreated} created, ${result.employeesMatched} matched`);
  return result;
}

/**
 * Extract unique employees from parsed records
 */
function extractUniqueEmployees(records: ParsedRecord[]): Array<{
  employeeId: string;
  name: string;
  department?: string;
  originalRows: number[];
}> {
  const employeeMap = new Map<string, {
    employeeId: string;
    name: string;
    department?: string;
    originalRows: number[];
  }>();

  for (const record of records) {
    const key = record.employeeId;
    
    if (employeeMap.has(key)) {
      const existing = employeeMap.get(key)!;
      existing.originalRows.push(record.originalRow);
      
      // Update name if current one is more complete
      if (record.employeeName.length > existing.name.length) {
        existing.name = record.employeeName;
      }
      
      // Update department if available
      if (record.department && !existing.department) {
        existing.department = record.department;
      }
    } else {
      employeeMap.set(key, {
        employeeId: record.employeeId,
        name: record.employeeName,
        department: record.department,
        originalRows: [record.originalRow]
      });
    }
  }

  return Array.from(employeeMap.values());
}

/**
 * Process a batch of employees
 */
async function processBatch(
  batch: Array<{
    employeeId: string;
    name: string;
    department?: string;
    originalRows: number[];
  }>,
  supabase: SupabaseClient,
  result: EmployeeProcessResult
) {
  try {
    // Build query based on matching strategy
    const employeeIds = batch.map(emp => emp.employeeId);
    
    let query = supabase.from('employees').select('id, user_id, badge_id, name');
    
    switch (EMPLOYEE_MATCH_STRATEGY) {
      case 'badge_id':
        query = query.in('badge_id', employeeIds);
        break;
      case 'user_id':
        query = query.in('user_id', employeeIds);
        break;
      case 'name_dob':
        // For name matching, we'll do individual lookups
        break;
    }

    const { data: existingEmployees, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('Error fetching employees:', fetchError);
      batch.forEach(emp => {
        result.errors.push(...emp.originalRows.map(row => ({
          row,
          error: `Failed to check employee existence: ${fetchError.message}`
        })));
      });
      return;
    }

    // Create lookup map for existing employees
    const existingMap = new Map<string, string>(); // employeeId -> uuid
    
    if (existingEmployees) {
      for (const emp of existingEmployees) {
        let key: string;
        switch (EMPLOYEE_MATCH_STRATEGY) {
          case 'badge_id':
            key = emp.badge_id;
            break;
          case 'user_id':
            key = emp.user_id;
            break;
          default:
            key = emp.user_id;
        }
        if (key) {
          existingMap.set(key, emp.id);
        }
      }
    }

    // Process each employee in the batch
    const newEmployeesToCreate: EmployeeRecord[] = [];

    for (const emp of batch) {
      if (existingMap.has(emp.employeeId)) {
        // Employee exists
        result.employeesMatched++;
        result.employeeMap.set(emp.employeeId, existingMap.get(emp.employeeId)!);
      } else if (AUTO_CREATE_EMPLOYEES) {
        // Employee doesn't exist, prepare for creation
        const newEmployee: EmployeeRecord = {
          user_id: emp.employeeId,
          name: emp.name,
          status: 'active' as const
        };

        // Set additional fields based on strategy
        switch (EMPLOYEE_MATCH_STRATEGY) {
          case 'badge_id':
            newEmployee.badge_id = emp.employeeId;
            break;
          case 'user_id':
            newEmployee.user_id = emp.employeeId;
            break;
        }

        if (emp.department) {
          newEmployee.department = emp.department;
        }

        newEmployeesToCreate.push(newEmployee);
      } else {
        // Employee doesn't exist and auto-creation is disabled
        result.errors.push(...emp.originalRows.map(row => ({
          row,
          error: `Employee ${emp.employeeId} (${emp.name}) not found in system`
        })));
      }
    }

    // Create new employees in batch
    if (newEmployeesToCreate.length > 0) {
      await createNewEmployees(newEmployeesToCreate, batch, supabase, result);
    }

  } catch (error) {
    console.error('Batch processing error:', error);
    batch.forEach(emp => {
      result.errors.push(...emp.originalRows.map(row => ({
        row,
        error: `Batch processing failed: ${error.message}`
      })));
    });
  }
}

/**
 * Create new employees and update result
 */
async function createNewEmployees(
  newEmployees: EmployeeRecord[],
  originalBatch: Array<{
    employeeId: string;
    name: string;
    department?: string;
    originalRows: number[];
  }>,
  supabase: SupabaseClient,
  result: EmployeeProcessResult
) {
  try {
    console.log(`Creating ${newEmployees.length} new employees`);

    const { data: createdEmployees, error: createError } = await supabase
      .from('employees')
      .insert(newEmployees)
      .select('id, user_id, badge_id');

    if (createError) {
      console.error('Error creating employees:', createError);
      
      // Handle specific constraint violations
      if (createError.code === '23505') { // Unique constraint violation
        // Try individual inserts to identify which ones failed
        await handleConstraintViolations(newEmployees, originalBatch, supabase, result);
      } else {
        // General error - mark all as failed
        originalBatch.forEach(emp => {
          result.errors.push(...emp.originalRows.map(row => ({
            row,
            error: `Failed to create employee ${emp.employeeId}: ${createError.message}`
          })));
        });
      }
      return;
    }

    if (!createdEmployees || createdEmployees.length === 0) {
      console.warn('No employees were created');
      return;
    }

    // Map created employees back to original IDs
    for (const createdEmp of createdEmployees) {
      let originalId: string;
      
      switch (EMPLOYEE_MATCH_STRATEGY) {
        case 'badge_id':
          originalId = createdEmp.badge_id;
          break;
        case 'user_id':
          originalId = createdEmp.user_id;
          break;
        default:
          originalId = createdEmp.user_id;
      }

      if (originalId) {
        result.employeeMap.set(originalId, createdEmp.id);
        result.newEmployeesCreated++;
      }
    }

    console.log(`Successfully created ${createdEmployees.length} employees`);

  } catch (error) {
    console.error('Employee creation error:', error);
    originalBatch.forEach(emp => {
      result.errors.push(...emp.originalRows.map(row => ({
        row,
        error: `Employee creation failed: ${error.message}`
      })));
    });
  }
}

/**
 * Handle constraint violations by trying individual inserts
 */
async function handleConstraintViolations(
  newEmployees: EmployeeRecord[],
  originalBatch: Array<{
    employeeId: string;
    name: string;
    department?: string;
    originalRows: number[];
  }>,
  supabase: SupabaseClient,
  result: EmployeeProcessResult
) {
  console.log('Handling constraint violations with individual inserts');

  for (let i = 0; i < newEmployees.length; i++) {
    const employee = newEmployees[i];
    const originalEmp = originalBatch[i];

    try {
      const { data: createdEmployee, error: individualError } = await supabase
        .from('employees')
        .insert([employee])
        .select('id, user_id, badge_id')
        .single();

      if (individualError) {
        if (individualError.code === '23505') {
          // Employee already exists (race condition), try to fetch it
          console.log(`Employee ${employee.user_id} already exists, fetching...`);
          
          const { data: existingEmp, error: fetchError } = await supabase
            .from('employees')
            .select('id, user_id, badge_id')
            .eq(EMPLOYEE_MATCH_STRATEGY === 'badge_id' ? 'badge_id' : 'user_id', originalEmp.employeeId)
            .single();

          if (!fetchError && existingEmp) {
            result.employeeMap.set(originalEmp.employeeId, existingEmp.id);
            result.employeesMatched++;
          } else {
            result.errors.push(...originalEmp.originalRows.map(row => ({
              row,
              error: `Employee ${originalEmp.employeeId} constraint violation and fetch failed`
            })));
          }
        } else {
          result.errors.push(...originalEmp.originalRows.map(row => ({
            row,
            error: `Failed to create employee ${originalEmp.employeeId}: ${individualError.message}`
          })));
        }
      } else if (createdEmployee) {
        result.employeeMap.set(originalEmp.employeeId, createdEmployee.id);
        result.newEmployeesCreated++;
      }
    } catch (error) {
      result.errors.push(...originalEmp.originalRows.map(row => ({
        row,
        error: `Individual employee creation failed: ${error.message}`
      })));
    }
  }
}

/**
 * Validate employee data before processing
 */
export function validateEmployeeRecord(employeeId: string, name: string): string | null {
  if (!employeeId || employeeId.trim().length === 0) {
    return 'Employee ID is required';
  }

  if (!name || name.trim().length === 0) {
    return 'Employee name is required';
  }

  if (employeeId.length > 50) {
    return 'Employee ID too long (max 50 characters)';
  }

  if (name.length > 255) {
    return 'Employee name too long (max 255 characters)';
  }

  // Additional validation rules can be added here
  return null;
}

/**
 * Get employee matching configuration
 */
export function getEmployeeMatchConfig() {
  return {
    strategy: EMPLOYEE_MATCH_STRATEGY,
    autoCreate: AUTO_CREATE_EMPLOYEES
  };
}

/**
 * Update employee matching strategy (for runtime configuration)
 */
export function setEmployeeMatchStrategy(strategy: 'badge_id' | 'user_id' | 'name_dob') {
  // In a real implementation, this might update a configuration store
  console.log(`Employee matching strategy would be updated to: ${strategy}`);
}