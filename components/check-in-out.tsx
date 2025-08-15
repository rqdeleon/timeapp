"use client";

import { useAttendance } from "@/lib/useAttendance";

type Props = {
  scheduleId: string;
};

export default function CheckInOut({ scheduleId }: Props) {
  const { loading, status, error, handleCheckIn, handleCheckOut } = useAttendance();

  return (
    <div className="border rounded p-4 w-full max-w-sm shadow-md">
      <h3 className="text-lg font-semibold mb-2">Attendance</h3>

      {status === "checked-in" ? (
        <p className="text-green-600">✅ Checked In</p>
      ) : status === "checked-out" ? (
        <p className="text-blue-600">📤 Checked Out</p>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleCheckIn(scheduleId)}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Check In
          </button>
          <button
            onClick={() => handleCheckOut(scheduleId)}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Check Out
          </button>
        </div>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
