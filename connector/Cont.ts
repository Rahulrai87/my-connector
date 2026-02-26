import {
  Controller,
  Post,
  Body,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { WrapperService } from './wrapper.service';
import { GenericWrapperDto } from './dto/generic-wrapper.dto';

@ApiTags('Generic Proxy Wrapper')
@Controller('wrapper')
export class WrapperController {
  constructor(private readonly wrapperService: WrapperService) {}

  @Post('proxy')
  @ApiOperation({
    summary:
      'Generic proxy (GET/POST) with global Basic Auth, sorting & pagination',
  })
  async proxy(
    @Body() dto: GenericWrapperDto,
    @Req() req: Request,
  ) {
    return this.wrapperService.proxyRequest(dto, req);
  }
}
