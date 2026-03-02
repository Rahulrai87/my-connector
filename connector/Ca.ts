import { Controller, Get, Param, Header } from '@nestjs/common';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('excel/:id')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header('Content-Disposition', 'attachment; filename=results.xlsx')
  async exportExcel(@Param('id') id: string) {
    return this.exportService.generateExcel(id);
  }

  @Get('csv/:id')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=results.csv')
  async exportCSV(@Param('id') id: string) {
    return this.exportService.generateCSV(id);
  }
}
