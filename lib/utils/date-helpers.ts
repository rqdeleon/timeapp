// utils/dateHelpers.ts
import { formatInTimeZone,   } from 'date-fns-tz';

export const convertToUserTimezone = (utcTime: string, timezone: string) => {
  return formatInTimeZone(new Date(utcTime), timezone, "yyyy-MM-dd");
};

export const convertToUTC = (localTime: Date, timezone: string) => {
  return formatInTimeZone(localTime, timezone, "yyyy-MM-dd");
};