export function daysOfWeekToString(days: number[]): string {
    return days.sort().join(',');
  }
  
  export function stringToDaysOfWeek(daysString: string): number[] {
    return daysString.split(',')
      .filter(s => s.length > 0)
      .map(s => parseInt(s, 10))
      .sort();
  }