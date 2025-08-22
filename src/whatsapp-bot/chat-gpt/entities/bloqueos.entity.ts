import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bloqueos')
export class Bloqueo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  telefono: string;

  @Column({ default: 0 })
  ofensasGraves: number;

  @Column({ nullable: true })
  motivoBloqueo: string;

  @Column({ type: 'timestamp', nullable: true })
  bloqueadoHasta: Date;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
