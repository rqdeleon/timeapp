"use client";

import { useState } from "react";
import { 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Eye, 
  CheckCircle, 
  XCircle,
  User,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {  AttendanceLog } from "@/types/attendance";

interface AttendanceCellActionProps {
  data: AttendanceLog;
}

export const AttendanceCellAction: React.FC<AttendanceCellActionProps> = ({
  data,
}) => {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [otApprovalOpen, setOTApprovalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/attendances/${data.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete attendance record');
      }
      
      toast({ 
        description: `Attendance record for ${data.employee.name} on ${new Date(data.date).toLocaleDateString()} has been deleted.`,
        variant: "default"
      });
      
      router.refresh();
      
    } catch (error) {
      toast({
        variant: 'destructive', 
        description: 'Something went wrong while deleting the attendance record.'
      });
    } finally {
      setDeleteOpen(false);
      setLoading(false);
    }
  };

  const handleQuickApproveOT = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/attendances/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_ot_hours: data.raw_ot_hours
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve overtime');
      }
      
      toast({ 
        description: `Overtime approved for ${data.employee.name}`,
      });
      
      router.refresh();
      
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to approve overtime.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRejectOT = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/attendances/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_ot_hours: 0
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject overtime');
      }
      
      toast({ 
        description: `Overtime rejected for ${data.employee.name}`,
      });
      
      router.refresh();
      
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to reject overtime.'
      });
    } finally {
      setLoading(false);
    }
  };

  const hasOvertime = data.raw_ot_hours > 0;
  const isOTApproved = data.approved_ot_hours === data.raw_ot_hours;
  const isOTRejected = data.approved_ot_hours === 0 && hasOvertime;
  const sendDate = format(data.date, 'yyyy-MM-dd' )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/attendances/${data.employee_id}?date=${sendDate}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => {/* TODO: Open edit modal */}}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Record
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/attendances/${data.employee_id}`)}
          >
            <User className="mr-2 h-4 w-4" />
            Employee History
          </DropdownMenuItem>
          
          {hasOvertime && (
            <>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => setOTApprovalOpen(true)}
              >
                <Clock className="mr-2 h-4 w-4" />
                Manage Overtime
              </DropdownMenuItem>
              
              {!isOTApproved && (
                <DropdownMenuItem
                  onClick={handleQuickApproveOT}
                  disabled={loading}
                  className="text-green-600 focus:text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Quick Approve OT
                </DropdownMenuItem>
              )}
              
              {!isOTRejected && (
                <DropdownMenuItem
                  onClick={handleQuickRejectOT}
                  disabled={loading}
                  className="text-red-600 focus:text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject OT
                </DropdownMenuItem>
              )}
            </>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Record
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the attendance record for{" "}
              <strong>{data.employee.name}</strong> on{" "}
              <strong>{new Date(data.date).toLocaleDateString()}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete Record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};