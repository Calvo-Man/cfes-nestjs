// src/miembros/dto/miembro.dto.ts
import { Expose } from 'class-transformer';

export class MiembroDTO {
  @Expose()
  id: number;

  @Expose()
  rol: string;

  @Expose()
  cargo: string;

  @Expose()
  name: string;

  @Expose()
  apellido: string;

  @Expose()
  telefono: string;

  

  // NO agregues @Expose() para password
}
