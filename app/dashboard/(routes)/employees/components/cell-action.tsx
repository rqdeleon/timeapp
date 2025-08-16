"use client";

import { useState } from "react";
import { 
  Copy, 
  Edit, 
  MoreHorizontal, 
  Trash, 
  Eye, 
  UserCheck, 
  UserX,
  Mail,
  Phone
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useRouter } from "next/navigation";

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

import { EmployeeColumnProps } from "@/types";

interface EmployeeCellActionProps {
  data: EmployeeColumnProps;
}

export const EmployeeCellAction: React.FC<EmployeeCellActionProps> = ({
  data,
}) => {
  const router = useRouter();
  const params = useParams();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      
      // TODO: Implement delete API call
      // await deleteEmployee(data.id);
      
      toast({ 
        description: `Employee ${data.name} has been deleted.`,
        variant: "default"
      });
      
      // Refresh the page or update the data
      router.refresh();
      
    } catch (error) {
      toast({
        variant: 'destructive', 
        description: 'Something went wrong while deleting the employee.'
      });
    } finally {
      setDeleteOpen(false);
      setLoading(false);
    }
  };

  const onCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ 
      description: `${label} copied to clipboard.`
    });
  };

  const toggleEmployeeStatus = async () => {
    try {
      setLoading(true);
      
      const newStatus = data.status === 'active' ? 'inactive' : 'active';
      
      // TODO: Implement status update API call
      // await updateEmployeeStatus(data.id, newStatus);
      
      toast({ 
        description: `Employee status updated to ${newStatus}.`
      });
      
      router.refresh();
      
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to update employee status.'
      });
    } finally {
      setLoading(false);
    }
  };

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
            onClick={() => router.push(`/dashboard/employees/${data.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/employees/${data.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Employee
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => onCopy(data.id, "Employee ID")}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy ID
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => onCopy(data.email, "Email")}
          >
            <Mail className="mr-2 h-4 w-4" />
            Copy Email
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => onCopy(data.phone, "Phone")}
          >
            <Phone className="mr-2 h-4 w-4" />
            Copy Phone
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={toggleEmployeeStatus}
            disabled={loading}
          >
            {data.status === 'active' ? (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Employee
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{data.name}</strong>'s account and remove all associated data 
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete Employee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};