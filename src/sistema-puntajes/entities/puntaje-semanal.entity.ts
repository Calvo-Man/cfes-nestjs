import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Miembro } from 'src/miembros/entities/miembro.entity';

@Entity('puntajes_semanales')
export class PuntajeSemanal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Miembro, (miembro) => miembro.puntajesSemanales, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  miembro: Miembro;

  @Column()
  semana: string; // ej: "2025-W36"

  @Column({ default: 0 })
  puntos: number;

  @Column({ default: 0 })
  correctas: number;

  @Column({ default: 0 })
  incorrectas: number;

  @Column({ default: false })
  finalizado: boolean; // true cuando termina la semana

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
