import { Injectable } from '@nestjs/common';

@Injectable()
export class TaskService {

  private parseDDMMYYYY(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  sortByDeadline(data: any[]) {
    return data.sort((a, b) => {
      const dateA = this.parseDDMMYYYY(a.stepDeadLine);
      const dateB = this.parseDDMMYYYY(b.stepDeadLine);
      return dateA.getTime() - dateB.getTime(); // ascending
    });
  }

}
