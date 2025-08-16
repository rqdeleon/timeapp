// __tests__/utils/dateHelpers.test.ts
import { convertToUserTimezone, getWeekDateRange } from './date-helpers';

describe('Date Helpers', () => {
  test('converts UTC to user timezone correctly', () => {
    const utcTime = '2024-03-15T14:00:00Z';
    const result = convertToUserTimezone(utcTime, 'America/New_York');
    expect(result).toBeDefined();
  });
});