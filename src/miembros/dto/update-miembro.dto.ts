import { PartialType } from '@nestjs/mapped-types';
import { CreateMiembroDto } from './create-miembro.dto';
import { Horario } from '../enum/horario.enum';
import { IsEnum } from 'class-validator';

export class UpdateMiembroDto extends PartialType(CreateMiembroDto) {
  @IsEnum(Horario)
  horario_aseo: Horario;
}
