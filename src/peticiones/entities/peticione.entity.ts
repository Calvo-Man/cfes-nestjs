import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('peticiones')
export class Peticion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nombre: string;

  @Column()
  contenido: string;

  @Column({ default: 'pendiente' })
  estado: 'pendiente' | 'en_oracion' | 'respondida';

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  categoria: string;

  @CreateDateColumn( { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;
}
