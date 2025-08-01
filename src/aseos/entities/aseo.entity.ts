import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Miembro } from 'src/miembros/entities/miembro.entity';

@Entity()
export class Aseo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' }) // o 'timestamp' si quieres incluir hora
  fecha: Date;

  @ManyToOne(() => Miembro, (miembro) => miembro.aseos, { eager: true })
  miembro: Miembro;
}
