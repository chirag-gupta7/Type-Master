/**
 * Regression tests for streak math in PracticeHeatMap.
 *
 * The old implementation parsed 'YYYY-MM-DD' keys as UTC midnight and then
 * normalized them with local setHours(0,0,0,0), mixing timezones. For users
 * behind UTC the parsed day shifted to the previous local day, breaking
 * streaks by one. The new implementation works purely in UTC-day space,
 * matching the backend activity keys and grid cells.
 */

import { calculateCurrentStreak, calculateLongestStreak } from '../PracticeHeatMap';

const utcDate = (iso: string): Date => new Date(iso);

describe('calculateCurrentStreak', () => {
  it('counts a streak ending today', () => {
    const data = [
      { date: '2026-03-08', count: 1 },
      { date: '2026-03-09', count: 2 },
      { date: '2026-03-10', count: 1 },
    ];
    expect(calculateCurrentStreak(data, utcDate('2026-03-10T15:00:00Z'))).toBe(3);
  });

  it('keeps the streak alive when the last active day was yesterday', () => {
    const data = [{ date: '2026-03-09', count: 1 }];
    expect(calculateCurrentStreak(data, utcDate('2026-03-10T02:00:00Z'))).toBe(1);
  });

  it('returns 0 when the last activity is more than one day old', () => {
    const data = [
      { date: '2026-03-07', count: 1 },
      { date: '2026-03-08', count: 1 },
    ];
    expect(calculateCurrentStreak(data, utcDate('2026-03-10T12:00:00Z'))).toBe(0);
  });

  it('stops counting at the first gap', () => {
    const data = [
      { date: '2026-03-06', count: 1 },
      // gap on 03-07
      { date: '2026-03-08', count: 1 },
      { date: '2026-03-09', count: 1 },
      { date: '2026-03-10', count: 1 },
    ];
    expect(calculateCurrentStreak(data, utcDate('2026-03-10T12:00:00Z'))).toBe(3);
  });

  it('returns 0 for empty data', () => {
    expect(calculateCurrentStreak([], utcDate('2026-03-10T12:00:00Z'))).toBe(0);
  });
});

describe('calculateLongestStreak', () => {
  it('finds the longest run of consecutive days anywhere in the data', () => {
    const data = [
      { date: '2026-01-01', count: 1 },
      { date: '2026-01-02', count: 1 },
      // 4-day run later in the month
      { date: '2026-01-20', count: 1 },
      { date: '2026-01-21', count: 1 },
      { date: '2026-01-22', count: 1 },
      { date: '2026-01-23', count: 1 },
    ];
    expect(calculateLongestStreak(data)).toBe(4);
  });

  it('returns 0 for empty data', () => {
    expect(calculateLongestStreak([])).toBe(0);
  });
});
