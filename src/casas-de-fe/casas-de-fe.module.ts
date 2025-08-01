import { Module } from '@nestjs/common';
import { CasasDeFeService } from './casas-de-fe.service';
import { CasasDeFeController } from './casas-de-fe.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasasDeFe } from './entities/casas-de-fe.entity';
import { GeocodingService } from 'src/geolocalizacion/geocoding.service';
import { NominatimService } from 'src/geolocalizacion/nominatim.service';
import { OpenRouteService } from 'src/geolocalizacion/openroute.service';
import { OpenCageService } from 'src/geolocalizacion/opencage.service';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { JwtService } from '@nestjs/jwt';
import { WhatsappBotService } from 'src/whatsapp-bot/whatsapp-bot.service';
import { MiembrosModule } from 'src/miembros/miembros.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CasasDeFe, Miembro]),
    MiembrosModule
  ],
  controllers: [CasasDeFeController],
  providers: [CasasDeFeService, GeocodingService,NominatimService,OpenRouteService,OpenCageService,JwtService],
  exports: [CasasDeFeService],
})
export class CasasDeFeModule {}
