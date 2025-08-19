// app/api/upload/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import  * as XLSX  from 'xlsx'

import { createClient } from '@/lib/utils/supabase/server';
import { parseFile } from '@/lib/upload-attendance/file-parser';
import { validateFileContent } from '@/lib/upload-attendance/validation';

const MAX_PREVIEW_ROWS = 5;
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

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` 
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'text/tab-separated-values', // .tsv
      'application/csv' // alternative CSV MIME type
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv|tsv)$/i)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file' 
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file temporarily for parsing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `preview-${Date.now()}-${file.name}`;
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    try {
      // Parse file with minimal column mapping for preview
      const previewMapping = {
        employeeId: 'auto-detect',
        employeeName: 'auto-detect',
        date: 'auto-detect',
        timeIn: 'auto-detect',
        timeOut: 'auto-detect'
      };

      // Use a lightweight parsing approach for preview
      const parsedData = await parseFileForPreview(filePath);
      
      if (!parsedData.headers || parsedData.headers.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No headers found in file. Please ensure your file has a header row.'
        });
      }

      // Validate file content
      const contentValidation = validateFileContent(
        parsedData.headers,
        parsedData.data,
        ['employeeId', 'date'] // minimum required
      );

      if (!contentValidation.isValid) {
        console.log(contentValidation)
        return NextResponse.json({
          success: false,
          message: 'File validation failed',
          errors: contentValidation.errors
        });

      }

      // Clean up temporary file
      try {
        const fs = await import('fs/promises');
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup preview file:', cleanupError);
      }

      // Return preview data
      const previewResponse = {
        success: true,
        headers: parsedData.headers,
        rows: parsedData.data.slice(0, MAX_PREVIEW_ROWS),
        rowCount: parsedData.data.length,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        }
      };

      return NextResponse.json(previewResponse);

    } catch (parseError) {
      console.error('File parsing error:', parseError);
      
      // Clean up temporary file on error
      try {
        const fs = await import('fs/promises');
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup file after parse error:', cleanupError);
      }

      return NextResponse.json({
        success: false,
        message: `File parsing failed: ${parseError.message}. Please ensure your file is properly formatted.`
      });
    }

  } catch (error) {
    console.error('Validation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Validation failed: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

/**
 * Lightweight file parsing for preview only
 */
async function parseFileForPreview(filePath: string) {
  const fileExtension = filePath.toLowerCase().split('.').pop();
  
  if (fileExtension === 'csv' || fileExtension === 'tsv') {
    return parseCSVForPreview(filePath, fileExtension === 'tsv' ? '\t' : ',');
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return parseExcelForPreview(filePath);
  } else {
    throw new Error(`Unsupported file format: ${fileExtension}`);
  }
}

/**
 * Parse CSV for preview
 */
function parseCSVForPreview(filePath: string, delimiter: string = ',') {
  const fs = require('fs');
  const Papa = require('papaparse');
  
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  
  const parseResult = Papa.parse(csvContent, {
    delimiter,
    header: false,
    skipEmptyLines: true,
    preview: 1000, // Limit to first 1000 rows for preview
    dynamicTyping: false
  });

  if (parseResult.errors.length > 0) {
    console.warn('CSV parsing warnings:', parseResult.errors);
  }

  const data = parseResult.data as string[][];
  if (data.length < 1) {
    throw new Error('File appears to be empty');
  }

  // Find header row
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i].map(cell => cell?.toLowerCase?.() || '');
    if (row.some(cell => 
      cell.includes('employee') || 
      cell.includes('name') || 
      cell.includes('id') ||
      cell.includes('date') ||
      cell.includes('time')
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
 * Parse Excel for preview
 */
function parseExcelForPreview(filePath: string) {
  const fs = require('fs');
  
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { 
    type: 'buffer',
    cellDates: false, // Keep as raw for preview
    sheetRows: 1000 // Limit rows for preview
  });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to 2D array
  const sheetData = XLSX.utils.sheet_to_json<any[]>(sheet, { 
    header: 1,
    raw: false,
    defval: '' // Default value for empty cells
  });

  if (sheetData.length < 1) {
    throw new Error('Excel sheet appears to be empty');
  }

  // THIS LOGIC IS NOT WORKING
  // let headerRowIndex = 0;
  // for (let i = 0; i < Math.min(50, sheetData.length); i++) {
  //   const row = sheetData[i]?.map(cell => String(cell || '').toLowerCase()) || [];
  //   if (row.some(cell => 
  //     cell.includes('employee no.') || 
  //     cell.includes('employee name') || 
  //     cell.includes('date') ||
  //     cell.includes('in') ||
  //     cell.includes('out')
  //   )) {
  //     headerRowIndex = i;
  //     break;
  //   }
  // }

  const headerRaw = sheetData[4]?.map(h => String(h || '').trim()) || [];
  const headers = headerRaw.filter( val => val);
  const dataRows = sheetData.slice(5);
  
  // Filter out completely empty rows
  const filteredDataRows = dataRows.filter(row => 
    row && row.some(cell => cell && String(cell).trim().length > 0)
  );

  return { headers, data: filteredDataRows };
}