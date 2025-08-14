import { forwardRef, Module } from '@nestjs/common';
//import { ManejoDeMensajesController } from './manejo-de-mensajes.controller';
import { ManejoDeMensajesService } from './manejo-de-mensajes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mensajes } from './entities/manejo-de-mensaje.entity';
import { MiembrosModule } from 'src/miembros/miembros.module';
import { MiembrosService } from 'src/miembros/miembros.service';
import { ManejoDeMensajesController } from './manejo-de-mensajes.controller';
import { AsistenciasModule } from 'src/asistencias/asistencias.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mensajes]),
   forwardRef(() => MiembrosModule), // ← aquí
   forwardRef(() => AsistenciasModule)
  ],
  controllers: [ManejoDeMensajesController],
  providers: [ManejoDeMensajesService],
  exports: [ManejoDeMensajesService],
})
export class ManejoDeMensajesModule {}
