import { CasasDeFe } from 'src/casas-de-fe/entities/casas-de-fe.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class MiembroCasaDeFe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column()
  telefono: string;

  @Column()
  direccion: string;

  @ManyToOne(() => CasasDeFe, (casa) => casa.miembros, {
    onDelete: 'CASCADE',
  })
  casasDeFe: CasasDeFe;
}
