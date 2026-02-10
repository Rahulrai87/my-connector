import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRegionDto } from '../dto/create-region.dto';
import { UpdateRegionDto } from '../dto/update-region.dto';

@Injectable()
export class RegionService {
  constructor(@InjectModel('Region') private model: Model<any>) {}

  async create(dto: CreateRegionDto) {
    const exists = await this.model.exists({ code: dto.code });
    if (exists) {
      throw new BadRequestException('Region already exists');
    }
    return this.model.create(dto);
  }

  findAll() {
    return this.model.find({ isDeleted: false });
  }

  findById(id: string) {
    return this.model.findById(id);
  }

  update(id: string, dto: UpdateRegionDto) {
    return this.model.findByIdAndUpdate(id, dto, { new: true });
  }

  softDelete(id: string) {
    return this.model.findByIdAndUpdate(id, {
      isDeleted: true,
      isActive: false,
    });
  }
}
