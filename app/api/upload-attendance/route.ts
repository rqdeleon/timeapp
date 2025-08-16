// app/api/upload/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { parseFile } from '@/lib/upload-attendance/file-parser';
import { processEmployees } from '@/lib/upload-attendance/employee-processor';
import { processAttendanceRecords } from '@/lib/upload-attendance/attendance-processor';
import { validateUploadData } from '@/lib/upload-attendance/validation';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const BATCH_SIZE = 500;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const columnMappingStr = formData.get('columnMapping') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    let columnMapping = {};
    try {
      columnMapping = JSON.parse(columnMappingStr || '{}');
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid column mapping' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    try {
      // Parse the file
      console.log('Parsing file:', fileName);
      const parsedData = await parseFile(filePath, columnMapping);
      
      console.log(parsedData);
      if (!parsedData || !parsedData.records || parsedData.records.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No valid records found in file',
          summary: {
            totalRows: 0,
            newEmployeesCreated: 0,
            employeesMatched: 0,
            attendanceInserted: 0,
            duplicatesSkipped: 0,
            errorsCount: 0
          },
          errors: []
        });
      }

      console.log(`Parsed ${parsedData.records.length} records from file`);

      // Validate parsed data
      const validation = await validateUploadData(parsedData.records);
      if (validation.errors.length > 0) {
        console.log(`Validation found ${validation.errors.length} errors`);
      }

      // Initialize tracking variables
      let totalProcessed = 0;
      let newEmployeesCreated = 0;
      let employeesMatched = 0;
      let attendanceInserted = 0;
      let duplicatesSkipped = 0;
      const allErrors: Array<{ row: number; error: string }> = [];

      // Add validation errors to the error list
      allErrors.push(...validation.errors);

      // Filter out invalid records
      const validRecords = parsedData.records.filter((_, index) => 
        !validation.errors.some(error => error.row === index + 1)
      );

      console.log(`Processing ${validRecords.length} valid records in batches of ${BATCH_SIZE}`);

      // Process records in batches
      for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
        const batch = validRecords.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(validRecords.length / BATCH_SIZE);
        
        console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`);

        try {
          // Process employees first (upsert missing employees)
          const employeeResult = await processEmployees(batch, supabase);
          newEmployeesCreated += employeeResult.newEmployeesCreated;
          employeesMatched += employeeResult.employeesMatched;
          allErrors.push(...employeeResult.errors);

          // Process attendance records
          const attendanceResult = await processAttendanceRecords(
            batch,
            supabase,
            employeeResult.employeeMap
          );
          attendanceInserted += attendanceResult.recordsInserted;
          duplicatesSkipped += attendanceResult.duplicatesSkipped;
          allErrors.push(...attendanceResult.errors);

          totalProcessed += batch.length;
          
        } catch (batchError) {
          console.error(`Batch ${batchNumber} processing error:`, batchError);
          allErrors.push({
            row: i + 1,
            error: `Batch processing failed: ${batchError.message}`
          });
        }
      }

      // Clean up temporary file
      try {
        const fs = await import('fs/promises');
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary file:', cleanupError);
      }

      const success = allErrors.length === 0 || (attendanceInserted > 0 && allErrors.length < parsedData.records.length / 2);
      
      const result = {
        success,
        message: success 
          ? `Successfully processed ${totalProcessed} records with ${allErrors.length} errors`
          : `Processing completed with ${allErrors.length} errors. Please review and correct the issues.`,
        summary: {
          totalRows: parsedData.records.length,
          newEmployeesCreated,
          employeesMatched,
          attendanceInserted,
          duplicatesSkipped,
          errorsCount: allErrors.length
        },
        errors: allErrors.slice(0, 100) // Limit to first 100 errors for response size
      };

      console.log('Processing completed:', result);
      return NextResponse.json(result);

    } catch (processingError) {
      console.error('File processing error:', processingError);
      
      // Clean up temporary file on error
      try {
        const fs = await import('fs/promises');
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary file after error:', cleanupError);
      }

      return NextResponse.json({
        success: false,
        message: `Processing failed: ${processingError.message}`,
        summary: {
          totalRows: 0,
          newEmployeesCreated: 0,
          employeesMatched: 0,
          attendanceInserted: 0,
          duplicatesSkipped: 0,
          errorsCount: 1
        },
        errors: [{ row: 0, error: processingError.message }]
      });
    }

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Upload failed: ${error.message}`,
        summary: {
          totalRows: 0,
          newEmployeesCreated: 0,
          employeesMatched: 0,
          attendanceInserted: 0,
          duplicatesSkipped: 0,
          errorsCount: 1
        },
        errors: [{ row: 0, error: error.message }]
      },
      { status: 500 }
    );
  }
}