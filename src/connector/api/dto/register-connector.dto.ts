import { IsString, IsBoolean } from 'class-validator';

export class RegisterConnectorDto {
  @IsString()
  name: string;

  @IsString()
  connectorType: string;

  @IsString()
  siteUrl: string;

  @IsString()
  cronJobExpression: string;

  @IsBoolean()
  recursive: boolean;
}