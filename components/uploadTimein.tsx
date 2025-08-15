'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { UploadResult } from '@/types';

export default function AttendanceUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setResult(null);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setResult(null);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const allowedExtensions = /\.(csv|xls|xlsx)$/i;
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.test(file.name)) {
      setResult({
        success: false,
        message: 'Invalid file type. Please select a CSV or Excel file.',
      });
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setResult({
        success: false,
        message: 'File size too large. Maximum size is 10MB.',
      });
      return false;
    }
    
    return true;
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-attendance', {
        method: 'POST',
        body: formData,
      });
      
      const data: UploadResult = await response.json();
      setResult(data);
      
      if (data.success) {
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Employee Attendance Records
          </CardTitle>
          <CardDescription>
            Upload CSV or Excel files containing employee time in/out records from your biometric system.
            The file should include employee name, ID, date, time in, and time out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Drop your file here</p>
                  <p className="text-muted-foreground">or click to browse</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="sr-only">
                    Choose file
                  </Label>
                  <Input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: CSV, XLS, XLSX (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {file && (
            <div className="space-y-4">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload and Process
                  </>
                )}
              </Button>
              
              {uploading && (
                <div className="space-y-2">
                  <Progress value={undefined} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    Parsing file and inserting records...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription className="text-sm">
                    <p className="font-medium mb-1">{result.message}</p>
                    {result.recordsProcessed !== undefined && (
                      <p>Records processed: {result.recordsProcessed}</p>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-800">Errors:</p>
                        <ul className="list-disc list-inside space-y-1 mt-1">
                          {result.errors.slice(0, 5).map((error, index) => (
                            <li key={index} className="text-red-700 text-xs">
                              {error}
                            </li>
                          ))}
                          {result.errors.length > 5 && (
                            <li className="text-red-700 text-xs">
                              ... and {result.errors.length - 5} more errors
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* File Format Help */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm mb-2">Expected File Format:</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Start Date </p>
              <p>• End Date </p>
              <p>• Employee Name</p>
              <p>• Employee ID</p>
              <p>• Date (MM/DD/YYYY or YYYY-MM-DD)</p>
              <p>• Day (DD)</p>
              <p>• Time In (HH:MM or HH:MM AM/PM)</p>
              <p>• Time Out (HH:MM or HH:MM AM/PM)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
