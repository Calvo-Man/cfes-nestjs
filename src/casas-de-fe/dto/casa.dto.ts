// src/casas-de-fe/dto/casa-de-fe.dto.ts
import { Expose, Type } from 'class-transformer';
import { AsistenciaDto } from 'src/asistencias/dto/asistencia.dto';
import { Asistencia } from 'src/asistencias/entities/asistencia.entity';
import { MiembroCasaDeFeDto } from 'src/miembro-casa-de-fe/dto/miembroCasa.dto';
import { MiembroCasaDeFe } from 'src/miembro-casa-de-fe/entities/miembro-casa-de-fe.entity';
import { MiembroDTO } from 'src/miembros/dto/miembro.dto';

export class CasaDeFeDTO {
  @Expose()
  id: number;

  @Expose()
  nombre: string;

  @Expose()
  latitud: number;

  @Expose()
  longitud: number;

  @Expose()
  direccion: string;

  @Expose()
  barrio: string;

  @Expose()
  @Type(() => MiembroDTO)
  encargadosId: MiembroDTO[];

  @Expose()
  @Type(() => MiembroCasaDeFeDto)
  miembros: MiembroCasaDeFe[];

  @Expose()
  categoria: string;

  @Expose()
  @Type(() => AsistenciaDto)
  asistencias: Asistencia[];
}
