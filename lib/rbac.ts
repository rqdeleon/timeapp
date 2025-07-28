//Role-based Access

export function canEditSchedule(role: string) {
  return role === "admin" || role === "manager";
}

export function canCheckIn(role: string) {
  return role === "employee";
}
