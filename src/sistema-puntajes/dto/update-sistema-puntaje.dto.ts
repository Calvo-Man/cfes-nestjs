import { PartialType } from '@nestjs/mapped-types';
import { CreateSistemaPuntajeDto } from './create-sistema-puntaje.dto';

export class UpdateSistemaPuntajeDto extends PartialType(CreateSistemaPuntajeDto) {}
