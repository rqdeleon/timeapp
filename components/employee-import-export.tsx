// components/employee-import-export.tsx
"use client"

import React, { useState } from 'react'
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import * as XLSX from 'xlsx'
import { EmployeeFormData } from '@/types'

interface ImportExportProps {
  onImportComplete: () => void
}

export const EmployeeImportExport: React.FC<ImportExportProps> = ({ 
  onImportComplete 
}) => {
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    success: number
    errors: string[]
  } | null>(null)
  const { toast } = useToast()

  const downloadTemplate = () => {
    const template = [
      {
        name: 'John Doe',
        email: 'john.doe@company.com',
        phone: '+1-555-0101',
        position: 'Software Engineer',
        department: 'Information Technology',
        salary: 75000,
        hire_date: '2024-01-15',
        birth_date: '1990-05-20',
        address: '123 Main St, City, State 12345',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '+1-555-0102',
        status: 'active'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Template')
    
    // Set column widths
    ws['!cols'] = [
      { width: 30 }, // name
      { width: 30 }, // email
      { width: 15 }, // phone
      { width: 20 }, // position
      { width: 20 }, // department
      { width: 12 }, // salary
      { width: 12 }, // hire_date
      { width: 12 }, // birth_date
      { width: 40 }, // address
      { width: 20 }, // emergency_contact_name
      { width: 20 }, // emergency_contact_phone
      { width: 10 }  // status
    ]

    XLSX.writeFile(wb, 'employee-template.xlsx')
    
    toast({
      description: 'Employee template downloaded successfully!'
    })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ]
      
      if (!validTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          description: 'Please upload a valid Excel (.xlsx) or CSV file.'
        })
        return
      }
      
      setImportFile(file)
      setImportResults(null)
    }
  }

  const processImportData = async (data: any[]) => {
    const results = { success: 0, errors: [] as string[] }
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      setImportProgress(((i + 1) / data.length) * 100)
      
      try {
        // Validate required fields
        if (!row.name || !row.email || !row.phone) {
          results.errors.push(`Row ${i + 2}: Missing required fields (name, email, phone)`)
          continue
        }
        
        // Map the row data to EmployeeFormData
        const employeeData: Partial<EmployeeFormData> = {
          name: row.name,
          email: row.email,
          phone: row.phone,
          position: row.position || '',
          department_id: '', // You'll need to map department name to ID
          salary: parseFloat(row.salary) || 0,
          hire_date: row.hire_date ? new Date(row.hire_date).toISOString().split('T')[0] : '',
          birth_date: row.birth_date ? new Date(row.birth_date).toISOString().split('T')[0] : undefined,
          address: row.address || '',
          emergency_contact_name: row.emergency_contact_name || '',
          emergency_contact_phone: row.emergency_contact_phone || '',
          status: row.status || 'active',
        }
        
        // TODO: Call your createEmployee API
        // await createEmployee(employeeData)
        
        results.success++
        
      } catch (error) {
        results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      
      // Add small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  }

  const handleImport = async () => {
    if (!importFile) return
    
    try {
      setImporting(true)
      setImportProgress(0)
      
      const data = await importFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      if (jsonData.length === 0) {
        throw new Error('The file appears to be empty or invalid.')
      }
      
      const results = await processImportData(jsonData)
      setImportResults(results)
      
      if (results.success > 0) {
        onImportComplete()
        toast({
          description: `Successfully imported ${results.success} employees!`
        })
      }
      
    } catch (error) {
      toast({
        variant: 'destructive',
        description: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setImporting(false)
      setImportProgress(0)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Download Template Button */}
      <Button
        variant="outline"
        onClick={downloadTemplate}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Download Template
      </Button>

      {/* Import Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Import Employees
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Employees</DialogTitle>
            <DialogDescription>
              Upload an Excel or CSV file to bulk import employees.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="import-file">Select File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={importing}
              />
              {importFile && (
                <p className="text-sm text-gray-600">
                  Selected: {importFile.name}
                </p>
              )}
            </div>

            {/* Import Progress */}
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing employees...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}

            {/* Import Results */}
            {importResults && (
              <div className="space-y-2">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p><strong>Import Complete:</strong></p>
                      <p>✓ Successfully imported: {importResults.success} employees</p>
                      {importResults.errors.length > 0 && (
                        <p>✗ Errors: {importResults.errors.length}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Show Errors */}
                {importResults.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto text-sm">
                    <p className="font-medium text-red-600 mb-1">Errors:</p>
                    {importResults.errors.map((error, index) => (
                      <p key={index} className="text-red-600 text-xs">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Instructions:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Download the template file first</li>
                  <li>Fill in employee data following the format</li>
                  <li>Save as Excel (.xlsx) or CSV format</li>
                  <li>Upload the file using the button above</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="w-full"
              >
                {importing ? 'Importing...' : 'Start Import'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}