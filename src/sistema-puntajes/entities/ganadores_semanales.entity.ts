// src/puntajes/entities/ganador-semanal.entity.ts
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity('ganadores_semanales')
export class GanadorSemanal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Miembro, { eager: true })
  miembro: Miembro;

  @Column()
  semana: string; // Ej: "2025-W36"

  @Column()
  puesto: number; // 1, 2 o 3

  @Column()
  puntos: number;

  @CreateDateColumn()
  createdAt: Date;
}
