import { Miembro } from "src/miembros/entities/miembro.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Contrato {
   @PrimaryGeneratedColumn()
   id: number

   @Column({ type: 'longtext', nullable: true })
   firma: string

   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
   fecha: Date

   @Column({default: true})
   vigente: boolean

   @ManyToOne(() => Miembro, (miembro) => miembro.contratos)
   miembro: Miembro

}
