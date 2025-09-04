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

  // 🔹 Para assistant con tool_calls
  @Column({
    type: 'json', // ✅ MySQL 5.7+ soporta JSON nativo
    nullable: true,
  })
  toolCalls?: { id: string; name: string; arguments: string }[];

  // 🔹 Para tool con referencia a un assistant.tool_calls.id
  @Column({ type: 'varchar', length: 100, nullable: true })
  toolCallId?: string;

  @Column({ type: 'longtext' }) // ✅ mejor que text si los mensajes son largos
  contenido: string;

  @CreateDateColumn({ type: 'timestamp' })
  creadoEn: Date;
}
