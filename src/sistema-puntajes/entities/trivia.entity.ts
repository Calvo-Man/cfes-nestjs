// src/trivias/entities/trivia.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Puntaje } from './puntaje.entity';

@Entity('trivias')
export class Trivia {
  @PrimaryGeneratedColumn()
  id: number;

  // Nombre de la trivia
  @Column()
  titulo: string;

  // Semana a la que pertenece (ej: "2025-W36")
  @Column()
  semana: string;

  @Column()
  fecha: string; // Ej: "2025-09-06"
  
  // Si ya terminó o sigue activa
  @Column({ default: false })
  finalizada: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relación: Una trivia tiene muchos puntajes (uno por miembro que participa)
  @OneToMany(() => Puntaje, (puntaje) => puntaje.trivia)
  puntajes: Puntaje[];
}
