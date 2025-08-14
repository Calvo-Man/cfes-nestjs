import { Module } from '@nestjs/common';
import { ChatGptRespuestasService } from './respuesta-mensajes.service';
import { MiembrosService } from 'src/miembros/miembros.service';
import { AseosModule } from 'src/aseos/aseos.module';
import { EventosModule } from 'src/eventos/eventos.module';
import { WhatsappBotService } from '../whatsapp-bot.service';
import { ContratosService } from 'src/contratos/contratos.service';
import { TranscripcionService } from '../voice-to-text.service';
import { AseosService } from 'src/aseos/aseos.service';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import { EventosService } from 'src/eventos/eventos.service';
import { CasasDeFeService } from 'src/casas-de-fe/casas-de-fe.service';
import { GeocodingService } from 'src/geolocalizacion/geocoding.service';
import { OpenRouteService } from 'src/geolocalizacion/openroute.service';
import { OpenCageService } from 'src/geolocalizacion/opencage.service';
import { TTSService } from '../text-to-voice.service';
import { TeologiaService } from './services/teologia.service';
import { JwtService } from '@nestjs/jwt';
import { ManejoDeMensajesModule } from 'src/manejo-de-mensajes/manejo-de-mensajes.module';
import { MiembrosModule } from 'src/miembros/miembros.module';
import { CasasDeFeModule } from 'src/casas-de-fe/casas-de-fe.module';

@Module({
  imports: [
    AseosModule,
    EventosModule,
    ManejoDeMensajesModule,
    MiembrosModule,
    CasasDeFeModule,
  ],
  providers: [
    WhatsappBotService,
    ChatGptRespuestasService,
    TranscripcionService,
    GeocodingService,
    OpenRouteService,
    OpenCageService,
    TTSService,
    TeologiaService,
    JwtService,
  ],
  exports: [ChatGptRespuestasService],
})
export class ChatGptRespuestasModule {}
