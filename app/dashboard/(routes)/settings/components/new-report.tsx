"use client";

import { useEffect, useState } from "react";
import { GetAttendanceReport } from "@/lib/reportService";

export default function NewReportPage() {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await GetAttendanceReport("2025-07-01", "2025-07-31");
      setReport(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Employee Attendance Report</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table-auto w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Employee</th>
              <th className="p-2 border">Department</th>
              <th className="p-2 border">Scheduled Hours</th>
              <th className="p-2 border">Worked Hours</th>
              <th className="p-2 border">Late</th>
              <th className="p-2 border">No-Shows</th>
            </tr>
          </thead>
          <tbody>
            {report.map((emp, i) => (
              <tr key={i} className="text-center border-t">
                <td className="p-2 border">{emp.name}</td>
                <td className="p-2 border">{emp.department}</td>
                <td className="p-2 border">{emp.totalScheduledHours.toFixed(1)}</td>
                <td className="p-2 border">{emp.totalWorkedHours.toFixed(1)}</td>
                <td className="p-2 border">{emp.lateCount}</td>
                <td className="p-2 border">{emp.absences}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
