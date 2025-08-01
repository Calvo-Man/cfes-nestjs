import { IsBase64, IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateContratoDto {
  @IsString({})
  @IsNotEmpty()
  firma: string;

  @IsBoolean()
  vigente: boolean;

  @IsNumber()
  miembroId: number;
}
