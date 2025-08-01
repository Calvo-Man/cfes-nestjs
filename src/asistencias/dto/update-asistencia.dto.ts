import { PartialType } from '@nestjs/mapped-types';
import { CreateAsistenciaDto } from './create-asistencia.dto';
import { Categoria } from 'src/casas-de-fe/enum/categoria.enum';

export class UpdateAsistenciaDto extends PartialType(CreateAsistenciaDto) {
   nombre: string;
    apellido: string;
    telefono: string;
    direccion: string;
    barrio: string; 
    categoria: Categoria;
    latitud: number;
    longitud: number;

}
