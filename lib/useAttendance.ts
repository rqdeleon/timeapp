import { checkIn, checkOut } from "./attendanceService";
import { useState } from "react";

export function useAttendance() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "checked-in" | "checked-out">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleCheckIn = async (schedule_id: string) => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await checkIn(schedule_id, now);
      setStatus("checked-in");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (schedule_id: string) => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await checkOut(schedule_id, now);
      setStatus("checked-out");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, status, error, handleCheckIn, handleCheckOut };
}
