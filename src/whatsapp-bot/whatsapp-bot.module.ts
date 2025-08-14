import { forwardRef, Module } from '@nestjs/common';
import { WhatsappBotService } from './whatsapp-bot.service';
import { ManejoDeMensajesModule } from 'src/manejo-de-mensajes/manejo-de-mensajes.module';
import { ChatGptRespuestasService } from './chat-gpt/respuesta-mensajes.service';
import { AseosModule } from 'src/aseos/aseos.module';
import { MiembrosModule } from 'src/miembros/miembros.module';
import { EventosModule } from 'src/eventos/eventos.module';
import { MiembrosService } from 'src/miembros/miembros.service';
import { EventosService } from 'src/eventos/eventos.service';
import { AseosService } from 'src/aseos/aseos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aseo } from 'src/aseos/entities/aseo.entity';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { Mensajes } from 'src/manejo-de-mensajes/entities/manejo-de-mensaje.entity';
import { Evento } from 'src/eventos/entities/evento.entity';
import { CasasDeFeService } from 'src/casas-de-fe/casas-de-fe.service';
import { CasasDeFe } from 'src/casas-de-fe/entities/casas-de-fe.entity';
import { GeocodingService } from 'src/geolocalizacion/geocoding.service';
import { OpenRouteService } from 'src/geolocalizacion/openroute.service';
import { OpenCageService } from 'src/geolocalizacion/opencage.service';
import { TranscripcionService } from './voice-to-text.service';
import { TTSService } from './text-to-voice.service';
import { ContratosModule } from 'src/contratos/contratos.module';
import { ContratosService } from 'src/contratos/contratos.service';
import { Contrato } from 'src/contratos/entities/contrato.entity';
import { TeologiaService } from './chat-gpt/services/teologia.service';
import { TeologiaController } from './chat-gpt/controllers/teologia.controller';
import { JwtService } from '@nestjs/jwt';
import { ChatGptRespuestasModule } from './chat-gpt/respuesta-mensajes.module';

@Module({
  imports: [
    //TypeOrmModule.forFeature([Aseo,Miembro,Mensajes,Evento,CasasDeFe,Contrato]),
    ContratosModule,
    ChatGptRespuestasModule,
    MiembrosModule,
    ManejoDeMensajesModule
  ],
  controllers: [
    TeologiaController
  ],
  providers: [
    WhatsappBotService,
    //ChatGptRespuestasService,
   // ContratosService,
    TranscripcionService,
    //AseosService,
    //ManejoDeMensajesService,
    //MiembrosService,
    //EventosService,
    //CasasDeFeService,
    //GeocodingService,
    //OpenRouteService,
    //OpenCageService,
    //TTSService,
    TeologiaService,
    JwtService
  ],
  exports: [WhatsappBotService,],
})
export class WhatsappBotModule {}
