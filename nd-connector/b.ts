// wrapper.controller.ts
import { Controller, Post, Body, Headers } from '@nestjs/common';
import { WrapperService } from './wrapper.service';

@Controller('wrapper')
export class WrapperController {
  constructor(private readonly wrapperService: WrapperService) {}

  @Post()
  async callWrapper(
    @Headers('authorization') token: string,
    @Body() body: any,
  ) {
    return this.wrapperService.fetchData(
      body.url,
      body.payload,
      body.page,
      body.pageSize,
      body.sortBy,
      token,
    );
  }
}
