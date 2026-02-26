import {
  Controller,
  Post,
  Body,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
} from '@nestjs/swagger';
import { WrapperService } from './wrapper.service';
import { GenericWrapperDto } from './dto/generic-wrapper.dto';

@ApiTags('Generic Proxy Wrapper')
@Controller('wrapper')
export class WrapperController {
  constructor(private readonly wrapperService: WrapperService) {}

  @Post('proxy')
  @ApiOperation({
    summary:
      'Generic proxy (GET/POST) with Basic Auth, sorting, pagination',
  })
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'Basic base64(username:password)',
  })
  async proxy(
    @Body() dto: GenericWrapperDto,
    @Headers('authorization') authorization: string,
  ) {
    return this.wrapperService.proxyRequest(dto, authorization);
  }
}
