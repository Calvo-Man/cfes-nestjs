import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddAsistenciaDto {
  @IsNumber()
  @IsNotEmpty()
  asistenciaId: number; // ID de la asistencia

  @IsNumber()
  @IsNotEmpty()
  casasDeFeId: number;

  
}
