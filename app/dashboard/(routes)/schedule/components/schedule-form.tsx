"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

import { UpsertSchedule } from "@/lib/services/schedule-service";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShiftType, Schedule, Employee, Department } from "@/types";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";


interface ScheduleFormClientProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  initialData?: {
    initialSchedules: Schedule[];
    employees: Employee[];
    departments: Department[];
    shiftTypes: ShiftType[];
    initialDate?: string | null;
  } | null;
  selectedEmployee?: {
    id: string,
    name: string,
  } | null;
  selectedDate?: Date | null
  selectedShift?: Schedule | null
  loading: boolean;
  error: string | null;
}

export function ScheduleFormClient({ 
  open, 
  onOpenChange, 
  onSaved, 
  initialData,
  selectedEmployee,
  selectedDate,
  selectedShift,
  loading: dataLoading,
  error: dataError
}: ScheduleFormClientProps) {
  const [formData, setFormData] = useState({
    id: "",
    employee_id: "",
    date: null,
    shift_type_id: "",
    start_time: "",
    end_time: "",
    status: "confirmed",
    location: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      setFormError(null);
      setSuccess(false);
      
      if (selectedShift) {
        setFormData({
          id: selectedShift.id || "",
          employee_id: selectedShift.employee_id || "",
          date: format(selectedDate, "yyyy-MM-dd"),
          shift_type_id: selectedShift.shift_type_id || "",
          start_time: selectedShift.start_time || "",
          end_time: selectedShift.end_time || "",
          status: selectedShift.status || "confirmed",
          location: selectedShift.location || "",
        });
      } else if (selectedDate) {
        setFormData({
          id: "",
          employee_id: selectedEmployee.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          shift_type_id: "",
          start_time: "",
          end_time: "",
          status: "confirmed",
          location: "",
        });
      }
    }
  }, [open, initialData]);


  //extract all shiftTypes available
  const { shiftTypes } = initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validation
    if (!formData.employee_id || !formData.shift_type_id || !formData.date) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      setFormError("Please specify both start and end times.");
      return;
    }

    setSubmitting(true);

    try {
  
      if (formData.id) {   
        // UPDATE existing schedule
          const buildSchedulePayload = {
            id: formData.id ,
            employee_id: formData.employee_id || null,
            date: formData.date,
            shift_type_id: formData.shift_type_id || null,
            start_time: formData.start_time,
            end_time: formData.end_time,
            status: formData.status || "pending",
            location: formData.location || null,
            total_breaks: 2,
            breaks_taken: 0,
          };

        //@ts-ignore
        const { error } = await UpsertSchedule(buildSchedulePayload)

        if (error) throw error;
      } else {
        // INSERT new schedule
          const buildSchedulePayload = {
            employee_id: formData.employee_id || null,
            date: formData.date,
            shift_type_id: formData.shift_type_id || null,
            start_time: formData.start_time,
            end_time: formData.end_time,
            status: formData.status || "pending",
            location: formData.location || null,
            total_breaks: 2,
            breaks_taken: 0,
          };
        //@ts-ignore
        const { error } = await UpsertSchedule(buildSchedulePayload)

        if (error) throw error;
      }

      setSuccess(true);
      
      // Show success message briefly before closing
      setTimeout(() => {
        onOpenChange(false);
        onSaved();
      }, 1500);

    } catch (error) {
      console.error("Error saving schedule:", error);
      setFormError(
        error instanceof Error 
          ? error.message 
          : "Failed to save schedule. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormError(null); // Clear error when user makes changes

    // Auto-set times based on selected shift type
    if (field === "shift_type_id") {
      const selectedShiftType = shiftTypes.find((st) => st.id === value);
      if (selectedShiftType) {
        setFormData((prev) => ({
          ...prev,
          start_time: selectedShiftType.default_start_time,
          end_time: selectedShiftType.default_end_time,
        }));
      }
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false);
    }
  };

  const dialogTitle = initialData ? "Edit Schedule" : "Add New Schedule";
  const dialogDescription = initialData
    ? "Modify the details of this shift assignment"
    : "Create a new shift assignment for an employee";
  const submitButtonText = initialData ? "Save Changes" : "Add Schedule";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {success && <CheckCircle className="h-5 w-5 text-green-600" />}
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {/* Data Loading State */}
        {dataLoading && (
          <div className="flex justify-center items-center h-40">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading form data...</p>
            </div>
          </div>
        )}

        {/* Data Error State */}
        {dataError && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {dataError}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Form Error State */}
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Schedule {initialData ? 'updated' : 'created'} successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        {!dataLoading && !dataError && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employee_id">
                Employee <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={!initialData ? selectedEmployee.id :formData.employee_id } 
                onValueChange={(value) => handleChange("employee_id", value)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {!initialData ?
                    <SelectItem key={selectedEmployee.id} value={selectedEmployee.id}>
                      <div className="flex flex-col">
                        <span>{selectedEmployee.name}</span>
                      </div>
                    </SelectItem>
                  :
                  initialData.employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex flex-col">
                        <span>{employee.name}</span>
                        <span className="text-xs text-gray-500">
                          {employee.position} - {employee.department.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))

                  }
                </SelectContent>
              </Select>
            </div>

            {/* Date and Shift Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift_type_id">
                  Shift Type <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.shift_type_id} 
                  onValueChange={(value) => handleChange("shift_type_id", value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift type" />
                  </SelectTrigger>
                  <SelectContent>
                    {
                      (shiftTypes.length > 0) &&
                      shiftTypes.map((shiftType) => (
                      <SelectItem key={shiftType.id} value={shiftType.id}>
                        <div className="flex flex-col">
                          <span>{shiftType.name}</span>
                          <span className="text-xs text-gray-500">
                            {shiftType.default_start_time} - {shiftType.default_end_time}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleChange("start_time", e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">
                  End Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleChange("end_time", e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Floor 1 - Operations"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleChange("status", value as any)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose} 
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  !formData.employee_id ||
                  !formData.shift_type_id ||
                  !formData.date ||
                  !formData.start_time ||
                  !formData.end_time ||
                  success
                }
                className="min-w-[120px]"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? 'Saving...' : submitButtonText}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
