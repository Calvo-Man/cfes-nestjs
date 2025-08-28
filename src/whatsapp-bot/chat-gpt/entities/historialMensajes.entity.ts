import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';


@Entity('historial_mensajes')
export class HistorialMensajes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  telefono: string; // mejor que Miembro si lo identificas por WhatsApp

  @Column({ type: 'enum', enum: ['user', 'assistant', 'tool', 'system'] })
  rol: 'user' | 'assistant' | 'tool' | 'system';

  @Column({ type: 'text' })
  contenido: string;

  @CreateDateColumn({ type: 'timestamp' })
  creadoEn: Date;
}
