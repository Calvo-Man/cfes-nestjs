// src/mensajes-pendientes/entities/mensaje-pendiente.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Mensajes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  telefono: string;

  @Column('text')
  contenido: string;

  @Column({nullable: true})
  enviar_por: string;

  @Column({ default: false })
  enviado: boolean;

  @CreateDateColumn()
  creadoEn: Date;
}
