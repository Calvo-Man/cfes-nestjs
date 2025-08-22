import { forwardRef, Module } from '@nestjs/common';
import { MiembroCasaDeFeService } from './miembro-casa-de-fe.service';
import { MiembroCasaDeFeController } from './miembro-casa-de-fe.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasasDeFe } from 'src/casas-de-fe/entities/casas-de-fe.entity';
import { MiembroCasaDeFe } from './entities/miembro-casa-de-fe.entity';
import { JwtService } from '@nestjs/jwt';
import { AsistenciasService } from 'src/asistencias/asistencias.service';
import { Asistencia } from 'src/asistencias/entities/asistencia.entity';
import { ManejoDeMensajesModule } from 'src/manejo-de-mensajes/manejo-de-mensajes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MiembroCasaDeFe, CasasDeFe, Asistencia]),
    forwardRef(() => ManejoDeMensajesModule),
  ],
  controllers: [MiembroCasaDeFeController],
  providers: [MiembroCasaDeFeService, JwtService, AsistenciasService],
  exports: [MiembroCasaDeFeService],
})
export class MiembroCasaDeFeModule {}
