import {
  Controller,
  Get,
  Param,
  Res,
  StreamableFile,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';
import { ExportService } from './export.service';

@ApiTags('Export')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('excel/:id')
  @ApiOperation({ summary: 'Download Excel file for result document' })
  @ApiParam({ name: 'id', type: String, description: 'Mongo Document ID' })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Excel file downloaded successfully',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  async downloadExcel(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const fileBuffer = await this.exportService.generateExcel(id);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=result-${id}.xlsx`,
    });

    return new StreamableFile(fileBuffer);
  }

  @Get('csv/:id')
  @ApiOperation({ summary: 'Download CSV file for result document' })
  @ApiParam({ name: 'id', type: String, description: 'Mongo Document ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV file downloaded successfully',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  async downloadCSV(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const fileBuffer = await this.exportService.generateCSV(id);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=result-${id}.csv`,
    });

    return new StreamableFile(fileBuffer);
  }
}
