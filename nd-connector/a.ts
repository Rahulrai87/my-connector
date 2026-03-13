// wrapper.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WrapperService {
  constructor(private readonly httpService: HttpService) {}

  private parseDate(value: string): Date {
    const [day, month, year] = value.split('/');
    return new Date(`${year}-${month}-${day}`);
  }

  async fetchData(
    url: string,
    payload: any,
    page = 1,
    pageSize = 10,
    sortBy = [],
    token: string,
  ) {
    const headers = {
      Authorization: token,
      'Content-Type': 'application/json',
    };

    const response = await firstValueFrom(
      this.httpService.post(url, payload, { headers }),
    );

    let data = response.data;

    if (!Array.isArray(data)) {
      data = data.items || [];
    }

    const totalCount = data.length;

    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    // -------- SORTING --------
    if (sortBy?.length) {
      data.sort((a, b) => {
        for (const s of sortBy) {
          let valA = a[s.fieldName];
          let valB = b[s.fieldName];

          if (
            typeof valA === 'string' &&
            typeof valB === 'string' &&
            dateRegex.test(valA) &&
            dateRegex.test(valB)
          ) {
            valA = this.parseDate(valA);
            valB = this.parseDate(valB);
          }

          if (valA < valB) return s.sort === 'asc' ? -1 : 1;
          if (valA > valB) return s.sort === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    // -------- PAGINATION --------
    const start = (page - 1) * pageSize;
    const paginatedData = data.slice(start, start + pageSize);

    return {
      totalCount,
      page,
      pageSize,
      data: paginatedData,
    };
  }
}
