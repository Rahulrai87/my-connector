import {
  Controller,
  Get,
  Param,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { ExportService } from './export.service';
import { Response } from 'express';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('excel/:id')
  async exportExcel(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.exportService.generateExcel(id);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=results-${id}.xlsx`,
    });

    return new StreamableFile(file);
  }

  @Get('csv/:id')
  async exportCSV(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.exportService.generateCSV(id);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=results-${id}.csv`,
    });

    return new StreamableFile(file);
  }
}
