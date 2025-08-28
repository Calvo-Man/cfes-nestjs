import { Module } from '@nestjs/common';
import { AseosService } from './aseos.service';
import { AseosController } from './aseos.controller';
import { AseoCronService } from './aseo-cron.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aseo } from './entities/aseo.entity';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { AseoGateway } from './aseo.gateway';
import { JwtService } from '@nestjs/jwt';
import { ManejoDeMensajesModule } from 'src/manejo-de-mensajes/manejo-de-mensajes.module';
import { MiembrosService } from 'src/miembros/miembros.service';
import { ContratosModule } from 'src/contratos/contratos.module';
import { ContratosService } from 'src/contratos/contratos.service';
import { Contrato } from 'src/contratos/entities/contrato.entity';


@Module({
   imports: [
    TypeOrmModule.forFeature([Aseo,Miembro,Contrato]), 
    ManejoDeMensajesModule,    
    ContratosModule
  ],
  controllers: [AseosController],
  providers: [AseosService, AseoCronService,AseoGateway,JwtService,MiembrosService,ContratosService],
  exports: [AseosService],
})
export class AseosModule {}
