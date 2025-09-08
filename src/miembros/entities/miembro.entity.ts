// src/miembros/entities/miembro.entity.ts
import { Aseo } from 'src/aseos/entities/aseo.entity';
import { CasasDeFe } from 'src/casas-de-fe/entities/casas-de-fe.entity';
import { Rol } from 'src/roles/enum/roles.enum';
import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Horario } from '../enum/horario.enum';
import { Cargo } from '../enum/cargo.enum';
import { Contrato } from 'src/contratos/entities/contrato.entity';
import { Modo } from '../enum/modo.enum';
import { Trivia } from 'src/sistema-puntajes/entities/trivia.entity';
import { Puntaje } from 'src/sistema-puntajes/entities/puntaje.entity';
import { PuntajeSemanal } from 'src/sistema-puntajes/entities/puntaje-semanal.entity';

@Entity('miembro')
export class Miembro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80 })
  name: string;

  @Column({ length: 80 })
  apellido: string;

  @Column({ length: 80 })
  user: string;

  @Column({ length: 80 })
  password: string;

  @Column({ length: 12, unique: true })
  telefono: string;

  @Column({ length: 12, nullable: true })
  cedula: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'enum', enum: Modo, default: Modo.TEXTO })
  modo_respuesta: string;

  @Column({ default: false })
  respondio_whatsapp: boolean;

  @Column({ type: 'boolean', default: true })
  disponibilidad_aseo: boolean;

  @Column({ type: 'enum', enum: Horario, default: Horario.ANY })
  horario_aseo: Horario;

  @Column({
    type: 'enum',
    enum: Rol,
    default: Rol.SERVIDOR,
  })
  rol: Rol;

  @Column({ type: 'enum', enum: Cargo, default: Cargo.NINGUNO })
  cargo: Cargo;

  @Column({ type: 'date', nullable: true })
  fecha_ingreso_como_servidor: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  deletedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // 🔹 Relaciones
  @OneToMany(() => Aseo, (aseo) => aseo.miembro)
  aseos: Aseo[];

  @ManyToMany(() => CasasDeFe, (casasDeFe) => casasDeFe.encargadosId)
  casasDeFe: CasasDeFe[];

  @OneToMany(() => Contrato, (contrato) => contrato.miembro)
  contratos: Contrato[];

  // 🟢 Relación con Puntajes (histórico de puntajes por semana y trivia)
  @OneToMany(() => Puntaje, (puntaje) => puntaje.miembro)
  puntajes: Puntaje[];

  // 🟢 Relación con PuntajeSemanal (puntaje semanal de cada miembro)
  @OneToMany(() => PuntajeSemanal, (puntajeSemanal) => puntajeSemanal.miembro)
  puntajesSemanales: PuntajeSemanal[];
}
