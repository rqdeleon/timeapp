import { cn } from "@/lib/utils"
import { Clock, Users } from "lucide-react"

interface ShiftCardProps {
  time: string
  shift: string
  progress?: string
  color: string
  className?: string
}

export default function ShiftCard({ time, shift, progress, color, className }: ShiftCardProps) {
  const colorClasses = {
    yellow: "border-yellow-500 bg-yellow-50",
    blue: "border-blue-500 bg-blue-50",
    green: "border-green-500 bg-green-50",
    red: "border-red-500 bg-red-50",
  }

  const progressColorClass = {
    yellow: "bg-yellow-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
  }

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-md border p-2 text-xs shadow-sm",
        color,
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{time}</span>
        </div>
        <Users className="h-3 w-3" />
      </div>
      <div className="font-medium">{shift}</div>
      {progress && (
        <div className="mt-1">
          <div className="h-1 rounded-full bg-gray-200">
            <div className={cn("h-full rounded-full", color)} style={{ width: "100%" }} />
          </div>
          <div className="text-right text-[10px] text-gray-500">{progress}</div>
        </div>
      )}
    </div>
  )
}
