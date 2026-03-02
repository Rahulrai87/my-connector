import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import { Response } from 'express';

@Injectable()
export class ExportService {
  constructor(
    @InjectModel('Result')
    private readonly resultModel: Model<any>,
  ) {}

  async exportExcel(id: string, res: Response) {
    const doc = await this.resultModel.findById(id).lean();

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const rows = this.convertObjectToRows(doc);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Results');

    worksheet.columns = [
      { header: 'Key', key: 'key', width: 25 },
      { header: 'Value', key: 'value', width: 25 },
    ];

    worksheet.addRows(rows);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=results-${id}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async exportCSV(id: string, res: Response) {
    const doc = await this.resultModel.findById(id).lean();

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const rows = this.convertObjectToRows(doc);

    const parser = new Parser({ fields: ['key', 'value'] });
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment(`results-${id}.csv`);
    res.send(csv);
  }

  private convertObjectToRows(doc: any) {
    const resultsObject = doc.results;

    return Object.entries(resultsObject).map(([key, value]) => ({
      key,
      value,
    }));
  }
}
