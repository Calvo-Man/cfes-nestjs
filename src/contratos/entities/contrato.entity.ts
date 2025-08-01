import { Miembro } from "src/miembros/entities/miembro.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Contrato {
   @PrimaryGeneratedColumn()
   id: number

   @Column({ type: 'longtext' })
   firma: string

   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
   fecha: Date

   @Column()
   vigente: boolean

   @ManyToOne(() => Miembro, (miembro) => miembro.contratos)
   miembro: Miembro

}
