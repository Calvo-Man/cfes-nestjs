import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Categoria } from '../enum/categoria.enum';

export class CreateCasasDeFeDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @IsNotEmpty()
  latitud: number;

  @IsNumber()
  @IsNotEmpty()
  longitud: number;

  @IsString()
  @IsNotEmpty()
  direccion: string;
  
  @IsString()
  @IsOptional()
  barrio?: string;

  @IsArray()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  encargadosId: number[];

  @IsEnum(Categoria)
  @IsNotEmpty()
  categoria: Categoria;

}
