import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type RolMensaje = 'user' | 'assistant' | 'tool' | 'system';

@Entity('historial_mensajes')
@Index(['telefono', 'rol'])
export class HistorialMensajes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  telefono: string;

  @Column({
    type: 'enum',
    enum: ['user', 'assistant', 'tool', 'system'],
  })
  rol: RolMensaje;

  @Column({
    type: 'json',
    nullable: true,
  })
  toolCalls: { id: string; name: string; arguments: string }[] | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  toolCallId: string | null;

  @Column({ type: 'longtext' }) // ✅ mejor que text si los mensajes son largos
  contenido: string;

  @CreateDateColumn({ type: 'timestamp' })
  creadoEn: Date;
}
