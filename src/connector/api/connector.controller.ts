import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { ConnectorService } from './connector.service';
import { RegisterConnectorDto } from './dto/register-connector.dto';

@Controller('connectors')
export class ConnectorController {
  constructor(private readonly service: ConnectorService) {}

  @Post()
  register(@Body() dto: RegisterConnectorDto) {
    return this.service.register(dto);
  }

  @Patch(':id/pause')
  pause(@Param('id') id: string) {
    return this.service.pause(id);
  }

  @Patch(':id/resume')
  resume(@Param('id') id: string) {
    return this.service.resume(id);
  }
}