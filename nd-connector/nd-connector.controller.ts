import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateConfigDto } from './dto/create-config.dto';
import { ConfigStatus } from './enums/config-status.enum';

@Controller('nd-connectors')
export class NdConnectorController {
  constructor(@InjectModel('Config') private config: Model<any>,
  @InjectModel('Module') private moduleModel: Model<any>,
  @InjectModel('Region') private regionModel: Model<any>,
) {}

  @Post()
  create(@Body() dto: CreateConfigDto) {
    return this.config.create(dto);
  }

  @Patch(':id/pause')
  pause(@Param('id') id: string) {
    return this.config.updateOne(
      { _id: id },
      { status: ConfigStatus.PAUSED },
    );
  }

  @Patch(':id/resume')
  resume(@Param('id') id: string) {
    return this.config.updateOne(
      { _id: id },
      { status: ConfigStatus.ACTIVE },
    );
  }

  @Patch(':id/delete')
  delete(@Param('id') id: string) {
    return this.config.updateOne(
      { _id: id },
      { isDeleted: true, status: ConfigStatus.INACTIVE },
    );
  }
}
