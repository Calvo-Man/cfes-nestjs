import { PartialType } from '@nestjs/mapped-types';
import { CreateCasasDeFeDto } from './create-casas-de-fe.dto';

export class UpdateCasasDeFeDto extends PartialType(CreateCasasDeFeDto) {
    nombre: string;

    latitud: number;

    longitud: number;

    encargadosId: number[];
}
