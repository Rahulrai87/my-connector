import { IsNotEmpty } from 'class-validator';

export class CreateRegionDto {
  @IsNotEmpty()
  code: string; // us-east-1, eu-west-1

  @IsNotEmpty()
  name: string;
}
