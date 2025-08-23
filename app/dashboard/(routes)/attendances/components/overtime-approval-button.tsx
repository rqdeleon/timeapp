"use client"

import React, { useState } from 'react'
import { Check, X, Edit2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { AttendanceLog } from '@/types/attendance'
import { updateAttendanceRecord } from '@/lib/services/attendance-services'

interface OvertimeApprovalButtonProps {
  record: AttendanceLog
  onUpdate?: () => void
}

export const OvertimeApprovalButton: React.FC<OvertimeApprovalButtonProps> = ({
  record,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false)
  const [customHours, setCustomHours] = useState(
    record.approved_ot_hours?.toString() || record.raw_ot_hours?.toString() || '0'
  )
  const [popoverOpen, setPopoverOpen] = useState(false)
  const { toast } = useToast()

  const handleQuickApproval = async (approved: boolean) => {
    setLoading(true)
    try {
      await updateAttendanceRecord(record.id, {
        approval_status: approved ? 'approved' : 'rejected',
        approved_ot_hours: approved ? record.raw_ot_hours : 0
      })

      toast({
        description: `Overtime ${approved ? 'approved' : 'rejected'} successfully`
      })

      onUpdate?.()
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to update overtime approval'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCustomApproval = async () => {
    const hours = parseFloat(customHours)
    if (isNaN(hours) || hours < 0) {
      toast({
        variant: 'destructive',
        description: 'Please enter a valid number of hours'
      })
      return
    }

    setLoading(true)
    try {
      await updateAttendanceRecord(record.id, {
        approval_status: hours > 0 ? 'approved' : 'rejected',
        approved_ot_hours: hours
      })

      toast({
        description: `Overtime updated to ${hours} hours`
      })

      setPopoverOpen(false)
      onUpdate?.()
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to update overtime hours'
      })
    } finally {
      setLoading(false)
    }
  }

  // Don't show approval buttons if no overtime
  if (!record.raw_ot_hours || record.raw_ot_hours === 0) {
    return <span className="text-muted-foreground">-</span>
  }

  const isApproved = record.approval_status === 'approved'
  const isRejected = record.approval_status === 'rejected'
  const isPending = record.approval_status === 'pending'

  return (
    <div className="flex items-center space-x-1">
      {isApproved && (
        <Badge className="bg-green-100 text-green-800 text-xs">
          <Check className="h-3 w-3 mr-1" />
          {record.approved_ot_hours?.toFixed(1)}h
        </Badge>
      )}
      
      {isRejected && (
        <Badge className="bg-red-100 text-red-800 text-xs">
          <X className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )}

      {isPending && (
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => handleQuickApproval(true)}
            disabled={loading}
            title="Quick approve all overtime hours"
          >
            <Check className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleQuickApproval(false)}
            disabled={loading}
            title="Reject overtime"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Custom Hours Popover */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Set custom approved hours"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Custom Overtime Approval</h4>
              <p className="text-sm text-muted-foreground">
                Raw overtime: {record.raw_ot_hours?.toFixed(2)} hours
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="approved-hours">Approved Hours</Label>
              <Input
                id="approved-hours"
                type="number"
                min="0"
                max={record.raw_ot_hours}
                step="0.25"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                placeholder="Enter approved hours"
              />
              <p className="text-xs text-muted-foreground">
                Enter 0 to reject overtime entirely
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPopoverOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCustomApproval}
                disabled={loading}
              >
                {loading ? (
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}