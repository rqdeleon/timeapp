"use client"
import { MapPin, AlertTriangle, Clock } from "lucide-react";

// Enhanced ShiftCard Component
const ShiftCard = ({ shift, onEdit, conflicts = [] }) => {
  const statusColors = {
    confirmed: 'bg-green-50 border-green-200 text-green-800',
    pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    completed: 'bg-blue-50 border-blue-200 text-blue-800',
    'no-show': 'bg-red-50 border-red-200 text-red-800'
  };

  const hasConflicts = conflicts.length > 0;

  return (
    <div 
      className={`
        relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
        hover:shadow-md hover:scale-[1.02] group
        ${statusColors[shift.status]}
        ${hasConflicts ? 'ring-2 ring-red-400' : ''}
      `}
      onClick={() => onEdit(shift)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(shift);
        }
      }}
      aria-label={`${shift.name || 'Shift'} from ${shift.start_time}, status: ${shift.status}`}
    >
      {hasConflicts && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-2 h-2 text-white" />
        </div>
      )}
      
      <div className="flex flex-col items-center justify-between mb-2">
        <div className="flex items-center gap-1 text-xs font-medium">
          <Clock className="w-3 h-3" />
          <span>{shift.start_time} </span>
        </div>
        <div className="text-xs opacity-75 capitalize">
          {shift.status}
        </div>
      </div>
      
      <div className="text-sm font-semibold mb-1">
        {shift.name}
      </div>
      
      {shift.location && (
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <MapPin className="w-3 h-3" />
          <span>{shift.location}</span>
        </div>
      )}
      
      <div className="absolute inset-0 bg-white bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
    </div>
  );
};

export default ShiftCard;