"use client"

import React, { useState } from 'react'
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { AttendanceLog } from '@/types/attendance'

interface BulkApproveDialogProps {
  selectedRecords: AttendanceLog[]
  onApprovalComplete: () => void
  children: React.ReactNode
}

export const BulkApproveDialog: React.FC<BulkApproveDialogProps> = ({
  selectedRecords,
  onApprovalComplete,
  children
}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [approvalType, setApprovalType] = useState('approve_all')
  const [customHours, setCustomHours] = useState('')
  const { toast } = useToast()

  // Filter records that have overtime hours
  const overtimeRecords = selectedRecords.filter(record => 
    record.raw_ot_hours && record.raw_ot_hours > 0
  )

  const handleBulkApproval = async () => {
    if (overtimeRecords.length === 0) {
      toast({
        variant: 'destructive',
        description: 'No records with overtime hours selected'
      })
      return
    }

    setLoading(true)
    
    try {
      let approvedHours: number | undefined

      switch (approvalType) {
        case 'approve_all':
          // Use original overtime hours for each record
          break
        case 'reject_all':
          approvedHours = 0
          break
        case 'custom':
          const hours = parseFloat(customHours)
          if (isNaN(hours) || hours < 0) {
            toast({
              variant: 'destructive',
              description: 'Please enter a valid number of hours'
            })
            setLoading(false)
            return
          }
          approvedHours = hours
          break
      }

      const response = await fetch('/api/attendances/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordIds: overtimeRecords.map(r => r.id),
          approvedHours
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Bulk approval failed')
      }

      toast({
        description: result.message
      })

      setOpen(false)
      onApprovalComplete()

    } catch (error) {
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to process bulk approval'
      })
    } finally {
      setLoading(false)
    }
  }

  const getTotalOvertimeHours = () => {
    return overtimeRecords.reduce((sum, record) => sum + (record.raw_ot_hours || 0), 0)
  }

  const getApprovalSummary = () => {
    const totalRecords = overtimeRecords.length
    const totalHours = getTotalOvertimeHours()
    
    switch (approvalType) {
      case 'approve_all':
        return `Approve ${totalHours.toFixed(1)} hours across ${totalRecords} records`
      case 'reject_all':
        return `Reject all overtime for ${totalRecords} records`
      case 'custom':
        const hours = parseFloat(customHours) || 0
        const totalCustom = hours * totalRecords
        return `Set ${hours} hours each (${totalCustom.toFixed(1)} total) for ${totalRecords} records`
      default:
        return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Overtime Approval
          </DialogTitle>
          <DialogDescription>
            Approve or reject overtime hours for multiple attendance records at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {selectedRecords.length}
              </div>
              <div className="text-sm text-blue-600">Total Selected</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">
                {overtimeRecords.length}
              </div>
              <div className="text-sm text-orange-600">With Overtime</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {getTotalOvertimeHours().toFixed(1)}h
              </div>
              <div className="text-sm text-green-600">Total OT Hours</div>
            </div>
          </div>

          {overtimeRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No records with overtime hours in your selection.</p>
            </div>
          ) : (
            <>
              {/* Approval Options */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Approval Action</Label>
                <RadioGroup value={approvalType} onValueChange={setApprovalType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="approve_all" id="approve_all" />
                    <Label htmlFor="approve_all" className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Approve all overtime hours as recorded
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reject_all" id="reject_all" />
                    <Label htmlFor="reject_all" className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Reject all overtime hours
                    </Label>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Set custom approved hours for each record
                      </Label>
                    </div>
                    {approvalType === 'custom' && (
                      <div className="ml-6 mt-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.25"
                            placeholder="0.00"
                            value={customHours}
                            onChange={(e) => setCustomHours(e.target.value)}
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">
                            hours per record
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Action Summary</Label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {getApprovalSummary()}
                  </p>
                </div>
              </div>

              {/* Records Preview */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Records with Overtime ({overtimeRecords.length})
                </Label>
                <div className="border rounded-md max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Current OT</TableHead>
                        <TableHead className="text-right">Will Approve</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overtimeRecords.map((record) => {
                        let approvedHours = 0
                        switch (approvalType) {
                          case 'approve_all':
                            approvedHours = record.raw_ot_hours || 0
                            break
                          case 'custom':
                            approvedHours = parseFloat(customHours) || 0
                            break
                        }

                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.employee?.name}
                            </TableCell>
                            <TableCell>
                              {new Date(record.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {record.raw_ot_hours?.toFixed(2)}h
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {approvedHours.toFixed(2)}h
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={approvedHours > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                                }
                              >
                                {approvedHours > 0 ? 'Approved' : 'Rejected'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkApproval}
              disabled={loading || overtimeRecords.length === 0}
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply to {overtimeRecords.length} Records
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}