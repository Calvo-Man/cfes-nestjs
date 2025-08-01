import { Asistencia } from 'src/asistencias/entities/asistencia.entity';
import { MiembroCasaDeFe } from 'src/miembro-casa-de-fe/entities/miembro-casa-de-fe.entity';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { Cargo } from 'src/miembros/enum/cargo.enum';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Categoria } from '../enum/categoria.enum';
@Entity()
export class CasasDeFe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({type:'enum', enum: Categoria, default:Categoria.Adultos})
  categoria: string;

  @ManyToMany(() => Miembro, (miembro) => miembro.casasDeFe, {
    cascade: false, // ❌ no se borra ningún miembro
  })
  @JoinTable()
  encargadosId: Miembro[];



  @Column('float')
  latitud: number;

  @Column('float')
  longitud: number;

  @Column()
  direccion: string;

  @OneToMany(() => Asistencia, (asistencia) => asistencia.casasDeFe)
  asistencias: Asistencia[];
  @OneToMany(() => MiembroCasaDeFe, (miembroCasa) => miembroCasa.casasDeFe)
  miembros: MiembroCasaDeFe[];
}
