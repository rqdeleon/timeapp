import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/upload-attendance/csv-parser';
import { parseExcel } from '@/lib//upload-attendance/excel-parser';
import { processAttendanceRecords } from '@/lib//upload-attendance/attendance-processor';
import { writeFileSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xls|xlsx)$/i)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload CSV or Excel files only.' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }
    
    let records;
    
    try {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const csvContent = await file.text();
        records = parseCSV(csvContent);
      } else {
        // Excel file
        
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Save temporarily
        const filePath = path.join(process.cwd(), "tmp-upload.xls");
        writeFileSync(filePath, buffer);

        // Parse Excel
       records = await parseExcel(filePath);
    
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to parse file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` 
        },
        { status: 400 }
      );
    }
    
    if (records.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid records found in the file' },
        { status: 400 }
      );
    }
    
    // Process and insert records
    const result = await processAttendanceRecords(records);
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 207 // 207 for partial success
    });

    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
