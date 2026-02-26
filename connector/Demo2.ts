import {
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GenericWrapperDto } from './dto/generic-wrapper.dto';

@Injectable()
export class WrapperService {
  private readonly DEFAULT_LIMIT = 10;
  private readonly MAX_LIMIT = 100;

  constructor(private readonly httpService: HttpService) {}

  async proxyRequest(
    dto: GenericWrapperDto,
    authorizationHeader?: string,
  ) {
    try {
      const safePage = dto.page && dto.page > 0 ? dto.page : 1;
      const safeLimit = Math.min(
        dto.limit && dto.limit > 0 ? dto.limit : this.DEFAULT_LIMIT,
        this.MAX_LIMIT,
      );

      // 🔐 Extract Basic Auth
      if (!authorizationHeader?.startsWith('Basic ')) {
        throw new HttpException(
          'Missing or invalid Basic Authorization header',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const base64Credentials = authorizationHeader.split(' ')[1];
      const decoded = Buffer.from(base64Credentials, 'base64')
        .toString('utf-8');
      const [username, password] = decoded.split(':');

      if (!username || !password) {
        throw new HttpException(
          'Invalid Basic credentials',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const axiosConfig: any = {
        headers: dto.headers || {},
        auth: { username, password },
      };

      let response;

      if (dto.method === 'GET') {
        axiosConfig.params = dto.queryParams || {};
        response = await firstValueFrom(
          this.httpService.get(dto.url, axiosConfig),
        );
      } else if (dto.method === 'POST') {
        response = await firstValueFrom(
          this.httpService.post(
            dto.url,
            dto.payload,
            axiosConfig,
          ),
        );
      } else {
        throw new HttpException(
          'Only GET and POST supported',
          HttpStatus.BAD_REQUEST,
        );
      }

      let data = response.data;

      if (!Array.isArray(data)) {
        return {
          message: 'Response is not an array. Pagination skipped.',
          raw: data,
        };
      }

      // 🔥 SORT BEFORE PAGINATION
      if (dto.sortBy?.length) {
        data = this.sortArray(data, dto.sortBy);
      }

      const total = data.length;
      const totalPages = Math.ceil(total / safeLimit) || 1;

      if (safePage > totalPages) {
        return {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages,
          data: [],
        };
      }

      const startIndex = (safePage - 1) * safeLimit;
      const paginatedData = data.slice(
        startIndex,
        startIndex + safeLimit,
      );

      return {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        data: paginatedData,
      };
    } catch (error) {
      throw new HttpException(
        error?.response?.data || 'External API call failed',
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // Smart Sorting Engine
  private sortArray(data: any[], sortBy: any[]) {
    return data.sort((a, b) => {
      for (const sort of sortBy) {
        let valueA = a[sort.field];
        let valueB = b[sort.field];

        if (valueA == null) return 1;
        if (valueB == null) return -1;

        if (this.isDate(valueA) && this.isDate(valueB)) {
          valueA = new Date(valueA).getTime();
          valueB = new Date(valueB).getTime();
        }

        if (!isNaN(valueA) && !isNaN(valueB)) {
          valueA = Number(valueA);
          valueB = Number(valueB);
        }

        if (valueA < valueB)
          return sort.direction === 'asc' ? -1 : 1;

        if (valueA > valueB)
          return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private isDate(value: any): boolean {
    return typeof value === 'string' && !isNaN(Date.parse(value));
  }
}
