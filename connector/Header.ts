async generateExcel(id: string): Promise<Buffer> {
  const doc = await this.resultModel.findById(id).lean();
  if (!doc) throw new NotFoundException('Document not found');

  const results = doc.results;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Results');

  // Dynamic columns
  worksheet.columns = Object.keys(results).map((key) => ({
    header: key,
    key,
    width: 25,
  }));

  // Add header styling
  const headerRow = worksheet.getRow(1);

  headerRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' }, // White font
    };

    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' }, // Dark blue background
    };

    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  worksheet.addRow(results);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
