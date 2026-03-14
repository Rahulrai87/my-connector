import { Injectable } from '@nestjs/common';

@Injectable()
export class TaskService {

  private parseDDMMYYYY(dateStr?: string): Date | null {
    if (!dateStr) return null;

    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    const [day, month, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  }

  sortByDeadline(data: any[]) {
    return data.sort((a, b) => {
      const dateA = this.parseDDMMYYYY(a.stepDeadLine);
      const dateB = this.parseDDMMYYYY(b.stepDeadLine);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;   // null values go last
      if (!dateB) return -1;

      return dateA.getTime() - dateB.getTime();
    });
  }
}
