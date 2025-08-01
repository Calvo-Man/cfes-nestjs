import { Module } from '@nestjs/common';
import { AsistenciasService } from './asistencias.service';
import { AsistenciasController } from './asistencias.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from './entities/asistencia.entity';
import { AsistenciasNotificacionService } from './asistencias-notificacion.service';
import { CasasDeFe } from 'src/casas-de-fe/entities/casas-de-fe.entity';
import { NominatimService } from 'src/geolocalizacion/nominatim.service';
import { OpenRouteService } from 'src/geolocalizacion/openroute.service';
import { GeocodingService } from 'src/geolocalizacion/geocoding.service';
import { JwtService } from '@nestjs/jwt';

import { ManejoDeMensajesModule } from 'src/manejo-de-mensajes/manejo-de-mensajes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asistencia, CasasDeFe]),
    ManejoDeMensajesModule,
  ],
  controllers: [AsistenciasController],
  providers: [
    AsistenciasService,
    GeocodingService,
    AsistenciasNotificacionService,
    NominatimService,
    OpenRouteService,
    JwtService,
  ],
  exports: [AsistenciasService],
})
export class AsistenciasModule {}
