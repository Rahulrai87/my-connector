// utils/working-days.ts

export function workingDaysBetween(start: Date, end: Date): number {

  let count = 0;
  let current = new Date(start);

  while (current <= end) {

    const day = current.getDay(); // 0 = Sunday, 6 = Saturday

    if (day !== 0 && day !== 6) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count - 1;
}
