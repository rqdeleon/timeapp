"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"

interface CSVUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CSVUpload({ open, onOpenChange }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setUploadStatus("idle")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)

    // Simulate upload process
    setTimeout(() => {
      setUploading(false)
      setUploadStatus("success")

      // Close dialog after success
      setTimeout(() => {
        onOpenChange(false)
        setFile(null)
        setUploadStatus("idle")
      }, 2000)
    }, 2000)
  }

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false)
      setFile(null)
      setUploadStatus("idle")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import CSV Data</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import employee data or schedules. Make sure your file follows the correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {uploadStatus === "idle" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} disabled={uploading} />
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>CSV format: Name, Email, Phone, Position, Department, Status</AlertDescription>
              </Alert>
            </>
          )}

          {uploadStatus === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                CSV file uploaded successfully! Data has been imported.
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to upload CSV file. Please check the format and try again.</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading || uploadStatus === "success"}>
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
