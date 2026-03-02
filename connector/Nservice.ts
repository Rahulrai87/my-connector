import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  constructor(
    @InjectModel('Result')
    private readonly resultModel: Model<any>,
  ) {}

  async generateExcel(id: string): Promise<Buffer> {
    const doc = await this.resultModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Document not found');

    const responses = doc?.results?.responses || [];
    if (!responses.length) {
      throw new NotFoundException('No responses found');
    }

    const workbook = new ExcelJS.Workbook();

    // Group by name
    const grouped = responses.reduce((acc, item) => {
      const sheetName = item.name || 'Unknown';

      if (!acc[sheetName]) acc[sheetName] = [];
      acc[sheetName].push(item);

      return acc;
    }, {});

    for (const [name, records] of Object.entries(grouped)) {
      const worksheet = workbook.addWorksheet(this.safeSheetName(name));

      worksheet.columns = [
        { header: 'Bookmark', key: 'bookmark', width: 20 },
        { header: 'Pages', key: 'pages', width: 15 },
        { header: 'Question', key: 'question', width: 40 },
        { header: 'Response', key: 'responses', width: 60 },
      ];

      // Style header
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
        };

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      worksheet.addRows(records);

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private safeSheetName(name: string): string {
    return name.substring(0, 31).replace(/[*?:/\\[\]]/g, '');
  }
}
