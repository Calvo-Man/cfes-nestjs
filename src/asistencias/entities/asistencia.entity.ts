import { CasasDeFe } from 'src/casas-de-fe/entities/casas-de-fe.entity';
import { Categoria } from 'src/casas-de-fe/enum/categoria.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Asistencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() // o 'timestamp' si quieres incluir hora
  nombre: string;

  @Column() // o 'timestamp' si quieres incluir hora
  apellido: string;

  @Column() // o 'timestamp' si quieres incluir hora
  telefono: string;

  @Column() // o 'timestamp' si quieres incluir hora
  direccion: string;

  @Column() // o 'timestamp' si quieres incluir hora
  barrio: string;

  @Column('float')
  latitud: number;

  @Column('float')
  longitud: number;

  @Column({nullable: true, type: 'float', default: null})
  distancia: number;
  @Column({ type: 'enum', enum: Categoria, default: Categoria.Adultos })
  categoria: string;

  @Column({ default: false })
  mensaje_enviado: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @ManyToOne(() => CasasDeFe, (casa) => casa.asistencias, {
    onDelete: 'SET NULL', // ❌ solo se elimina la relación, no la asistencia
    nullable: true,
  })
  casasDeFe: CasasDeFe | null;
}
