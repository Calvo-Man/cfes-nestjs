import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Categoria } from 'src/casas-de-fe/enum/categoria.enum';

export class CreateAsistenciaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;
  @IsString()
  @IsNotEmpty()
  apellido: string;
  @IsString()
  @IsNotEmpty()
  telefono: string;
  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsNumber()
  @IsNotEmpty()
  latitud: number;

  @IsNumber()
  @IsNotEmpty()
  longitud: number;

  @IsString()
  @IsOptional()
  barrio: string;

  @IsEnum(Categoria)
  @IsNotEmpty()
  categoria: Categoria;
}
