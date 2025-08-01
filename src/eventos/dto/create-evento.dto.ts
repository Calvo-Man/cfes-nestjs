import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateEventoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Date) // ✅ convierte el string en Date
  @IsDate()  // ✅ valida que sea una fecha válida
  @IsNotEmpty()       
  date: Date;
}
