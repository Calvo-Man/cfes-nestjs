import { IsOptional, IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreatePeticionDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsNotEmpty()
  @IsString()
  contenido: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  redaccion?: string;

  @IsOptional()
  @IsIn(['pendiente', 'en_oracion', 'respondida'])
  estado?: 'pendiente' | 'en_oracion' | 'respondida';
}
