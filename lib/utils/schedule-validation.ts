import type { Schedule } from "@/types"; 
// utils/scheduleValidation.ts
export const detectScheduleConflicts = (
  newSchedule: Partial<Schedule>,
  existingSchedules: Schedule[]
): ScheduleConflict[] => {
  return existingSchedules
    .filter(schedule => 
      schedule.id === newSchedule.id &&
      schedule.date === newSchedule.date &&
      schedule.id !== newSchedule.id
    )
    .filter(schedule => {
      const newStart = new Date(newSchedule.start_time!);
      const newEnd = new Date(newSchedule.end_time!);
      const existingStart = new Date(schedule.start_time);
      const existingEnd = new Date(schedule.end_time);
      
      return (newStart < existingEnd && newEnd > existingStart);
    })
    .map(conflict => ({
      type: 'overlap',
      conflictingSchedule: conflict,
      message: `Overlaps with ${conflict.shift_type?.name} shift`
    }));
};