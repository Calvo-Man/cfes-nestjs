// src/puntajes/entities/puntaje.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { Trivia } from './trivia.entity';

@Entity('puntajes')
export class Puntaje {
  @PrimaryGeneratedColumn()
  id: number;

  // Total de puntos acumulados
  @Column({ default: 0 })
  puntos: number;

  // Respuestas correctas
  @Column({ default: 0 })
  correctas: number;

  // Respuestas incorrectas
  @Column({ default: 0 })
  incorrectas: number;

  // Mejor racha de respuestas correctas
  @Column({ default: 0 })
  rachaCorrectas: number;

  // Mejor racha de respuestas incorrectas
  @Column({ default: 0 })
  rachaIncorrectas: number;

  // Semana de la trivia (redundante pero útil para consultas rápidas)
  @Column()
  semana: string;

  @Column({ default: false })
  finalizado: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Miembro, (miembro) => miembro.puntajes, {
    onDelete: 'CASCADE', // si se borra el miembro, borra sus puntajes
    onUpdate: 'CASCADE',
  })
  miembro: Miembro;

  // Relación: este puntaje pertenece a una trivia
  @ManyToOne(() => Trivia, (trivia) => trivia.puntajes, {
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  trivia: Trivia;
}
