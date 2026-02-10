import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateModuleDto } from '../dto/create-module.dto';
import { UpdateModuleDto } from '../dto/update-module.dto';

@Injectable()
export class ModuleService {
  constructor(@InjectModel('Module') private model: Model<any>) {}

  async create(dto: CreateModuleDto) {
    const exists = await this.model.exists({ name: dto.name });
    if (exists) {
      throw new BadRequestException('Module already exists');
    }
    return this.model.create(dto);
  }

  findAll() {
    return this.model.find({ isDeleted: false });
  }

  findById(id: string) {
    return this.model.findById(id);
  }

  update(id: string, dto: UpdateModuleDto) {
    return this.model.findByIdAndUpdate(id, dto, { new: true });
  }

  softDelete(id: string) {
    return this.model.findByIdAndUpdate(id, {
      isDeleted: true,
      isActive: false,
    });
  }
}
