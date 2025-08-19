'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Clock,
  Download,
  X,
  Eye
} from 'lucide-react';
import FileUpload from './components/file-upload';
import ColumnMapper from './components/column-mapper';
import ProgressIndicator from './components/progress-indicator';

interface FilePreview {
  headers: string[];
  rows: any[][];
  rowCount: number;
}

interface ColumnMapping {
  [key: string]: string;
}

interface ProcessingResult {
  success: boolean;
  message: string;
  summary: {
    totalRows: number;
    newEmployeesCreated: number;
    employeesMatched: number;
    attendanceInserted: number;
    duplicatesSkipped: number;
    errorsCount: number;
  };
  errors: Array<{
    row: number;
    error: string;
  }>;
}

interface ProcessingProgress {
  stage: 'validation' | 'employee_processing' | 'attendance_processing' | 'completed';
  progress: number;
  currentBatch: number;
  totalBatches: number;
  processed: number;
  total: number;
}

export default function AttendanceUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'mapping' | 'processing' | 'complete'>('upload');

  // File upload handler
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setCurrentStep('preview');

    try {
      // Validate and preview file
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload-attendance/validate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`File validation failed: ${response.statusText}`);
      }

      const preview = await response.json();
      console.log(preview)
      setFilePreview(preview);
      setCurrentStep('mapping');

      // Auto-detect column mappings
      if (preview.headers) {
        const autoMapping = generateAutoMapping(preview.headers);
        setColumnMapping(autoMapping);
      }
    } catch (error) {
      console.error('File preview error:', error);
      setResult({
        success: false,
        message: `File preview failed: ${error.message}`,
        summary: { totalRows: 0, newEmployeesCreated: 0, employeesMatched: 0, attendanceInserted: 0, duplicatesSkipped: 0, errorsCount: 1 },
        errors: [{ row: 0, error: error.message }]
      });
      setCurrentStep('complete');
    }
  }, []);

  // Auto-generate column mappings based on headers
  const generateAutoMapping = (headers: string[]): ColumnMapping => {
    const mappings: ColumnMapping = {};
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

    const patterns = {
      employeeId: ['id', 'employee_id', 'emp_id', 'badge_id', 'employee no', 'payroll_id'],
      name: ['name', 'employee name', 'full name', 'emp name', 'employee_name'],
      date: ['date', 'work date', 'attendance date', 'day'],
      timeIn: ['time in', 'clock in', 'in', 'start time', 'punch in'],
      timeOut: ['time out', 'clock out', 'out', 'end time', 'punch out'],
      department: ['department', 'dept', 'division', 'section']
    };

    for (const [field, variations] of Object.entries(patterns)) {
      for (let i = 0; i < normalizedHeaders.length; i++) {
        const header = normalizedHeaders[i];
        if (variations.some(pattern => header.includes(pattern))) {
          mappings[field] = headers[i];
          break;
        }
      }
    }

    return mappings;
  };

  // Process the uploaded file
  const handleProcessUpload = async () => {
    if (!file || !filePreview) return;

    setIsProcessing(true);
    setCurrentStep('processing');
    setProcessingProgress({
      stage: 'validation',
      progress: 0,
      currentBatch: 0,
      totalBatches: 0,
      processed: 0,
      total: filePreview.rowCount
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('columnMapping', JSON.stringify(columnMapping));

      // Use EventSource for real-time progress updates
      const response = await fetch('/api/upload-attendance/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setResult(result);
      setCurrentStep('complete');

    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: false,
        message: `Upload failed: ${error.message}`,
        summary: { totalRows: 0, newEmployeesCreated: 0, employeesMatched: 0, attendanceInserted: 0, duplicatesSkipped: 0, errorsCount: 1 },
        errors: [{ row: 0, error: error.message }]
      });
      setCurrentStep('complete');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  };

  // Download error report
  const downloadErrorReport = () => {
    if (!result?.errors.length) return;

    const csvContent = [
      'Row Number,Error',
      ...result.errors.map(error => `${error.row},"${error.error}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upload-errors-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset upload
  const resetUpload = () => {
    setFile(null);
    setFilePreview(null);
    setColumnMapping({});
    setResult(null);
    setCurrentStep('upload');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[
          { step: 'upload', label: 'Upload', icon: Upload },
          { step: 'preview', label: 'Preview', icon: Eye },
          { step: 'mapping', label: 'Mapping', icon: FileSpreadsheet },
          { step: 'processing', label: 'Processing', icon: Clock },
          { step: 'complete', label: 'Complete', icon: CheckCircle }
        ].map(({ step, label, icon: Icon }, index) => (
          <React.Fragment key={step}>
            <div className={`flex flex-col items-center space-y-2 ${
              currentStep === step ? 'text-primary' : 
              ['upload', 'preview', 'mapping', 'processing', 'complete'].indexOf(currentStep) > index ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`p-2 rounded-full border-2 ${
                currentStep === step ? 'border-primary bg-primary/10' :
                ['upload', 'preview', 'mapping', 'processing', 'complete'].indexOf(currentStep) > index ? 'border-green-600 bg-green-50' : 'border-gray-300'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </div>
            {index < 4 && (
              <div className={`w-12 h-0.5 ${
                ['upload', 'preview', 'mapping', 'processing', 'complete'].indexOf(currentStep) > index ? 'bg-green-600' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: File Upload */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Attendance File
            </CardTitle>
            <CardDescription>
              Select or drag & drop your biometric system export file (XLSX, CSV, or TSV format)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload 
              onFileSelect={handleFileSelect}
              accept=".xlsx,.xls,.csv,.tsv"
              maxSize={10 * 1024 * 1024} // 10MB
            />
            
            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-medium">Supported File Formats:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Excel (.xlsx, .xls)</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">CSV (.csv)</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">TSV (.tsv)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: File Preview */}
      {currentStep === 'preview' && filePreview && (
        <Card>
          <CardHeader>
            <CardTitle>File Preview</CardTitle>
            <CardDescription>
              Preview of your file - showing first 5 rows of {filePreview.rowCount} total rows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {filePreview.headers.map((header, index) => (
                      <th key={index} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filePreview.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-3 py-2 text-sm">
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Column Mapping */}
      {currentStep === 'mapping' && filePreview && (
        <Card>
          <CardHeader>
            <CardTitle>Column Mapping</CardTitle>
            <CardDescription>
              Map your file columns to the required fields. Auto-detected mappings are shown.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ColumnMapper
              headers={filePreview.headers}
              mapping={columnMapping}
              onChange={setColumnMapping}
            />
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleProcessUpload} 
                disabled={!columnMapping.employeeId || !columnMapping.date}
                className="min-w-32"
              >
                Process Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Processing */}
      {currentStep === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Upload</CardTitle>
            <CardDescription>
              Processing your attendance data. This may take a few moments...
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processingProgress && (
              <ProgressIndicator progress={processingProgress} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Results */}
      {currentStep === 'complete' && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              Upload {result.success ? 'Completed' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Results Summary */}
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertTitle>{result.message}</AlertTitle>
            </Alert>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.summary.totalRows}</div>
                <div className="text-sm text-blue-800">Total Rows</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.summary.newEmployeesCreated}</div>
                <div className="text-sm text-green-800">New Employees</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{result.summary.attendanceInserted}</div>
                <div className="text-sm text-purple-800">Attendance Records</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{result.summary.duplicatesSkipped}</div>
                <div className="text-sm text-orange-800">Duplicates Skipped</div>
              </div>
            </div>

            {/* Error Details */}
            {result.errors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-red-600">
                    Errors ({result.errors.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrorReport}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Error Report
                  </Button>
                </div>
                
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {result.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border-b border-gray-100 last:border-b-0">
                      <Badge variant="destructive" className="mt-0.5">
                        Row {error.row}
                      </Badge>
                      <span className="text-sm text-gray-700 flex-1">{error.error}</span>
                    </div>
                  ))}
                  {result.errors.length > 10 && (
                    <div className="p-3 text-center text-sm text-gray-500">
                      ... and {result.errors.length - 10} more errors. Download the full report for details.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button onClick={resetUpload} variant="outline">
                Upload Another File
              </Button>
              {result.success && (
                <Button onClick={() => window.location.href = '/attendance'}>
                  View Attendance Records
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}