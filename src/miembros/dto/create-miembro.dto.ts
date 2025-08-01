import { IsBase64, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Rol } from 'src/roles/enum/roles.enum';
import { Horario } from '../enum/horario.enum';
import { Not } from 'typeorm';
import { Cargo } from '../enum/cargo.enum';

export class CreateMiembroDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;
  
  @IsEnum(Rol)
  @IsNotEmpty()
  rol: Rol;

  @IsEnum(Horario)
  @IsOptional()
  horario_aseo: Horario;

  @IsEnum(Cargo)
  @IsOptional()
  cargo: Cargo;

  @IsOptional()
  @IsNumber()
  contratoId: number;

  @IsOptional()
  @IsString()
  firma: string;
}
