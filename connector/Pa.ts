import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';

/**
 * Strongly typed response structure
 */
interface ResponseRecord {
  name: string;
  bookmark: string;
  pages: string;
  question: string;
  responses: string;
}

@Injectable()
export class ExportService {
  constructor(
    @InjectModel('Result')
    private readonly resultModel: Model<any>,
  ) {}

  async generateExcel(id: string): Promise<Buffer> {
    const doc = await this.resultModel.findById(id).lean();
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const responses: ResponseRecord[] =
      doc?.results?.responses ?? [];

    if (!responses.length) {
      throw new NotFoundException('No responses found');
    }

    const workbook = new ExcelJS.Workbook();

    /**
     * Group records by "name"
     */
    const grouped: Record<string, ResponseRecord[]> =
      responses.reduce(
        (acc: Record<string, ResponseRecord[]>, item: ResponseRecord) => {
          const sheetName = item.name || 'Unknown';

          if (!acc[sheetName]) {
            acc[sheetName] = [];
          }

          acc[sheetName].push(item);
          return acc;
        },
        {},
      );

    /**
     * Create sheet per group
     */
    for (const name in grouped) {
      const records = grouped[name];

      const worksheet = workbook.addWorksheet(
        this.safeSheetName(name),
      );

      worksheet.columns = [
        { header: 'Bookmark', key: 'bookmark', width: 20 },
        { header: 'Pages', key: 'pages', width: 15 },
        { header: 'Question', key: 'question', width: 40 },
        { header: 'Response', key: 'responses', width: 60 },
      ];

      this.styleHeader(worksheet);

      worksheet.addRows(records);

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Header Styling
   */
  private styleHeader(worksheet: ExcelJS.Worksheet): void {
    const headerRow = worksheet.getRow(1);

    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E78' },
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };

      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  }

  /**
   * Excel sheet name safety (max 31 chars, remove invalid chars)
   */
  private safeSheetName(name: string): string {
    return name.substring(0, 31).replace(/[*?:/\\[\]]/g, '');
  }
}
