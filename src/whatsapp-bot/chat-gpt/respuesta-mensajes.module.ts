import { Module } from '@nestjs/common';
import { ChatGptRespuestasService } from './respuesta-mensajes.service';
import { AseosModule } from 'src/aseos/aseos.module';
import { EventosModule } from 'src/eventos/eventos.module';
import { WhatsappBotService } from '../whatsapp-bot.service';
import { TranscripcionService } from '../voice-to-text.service';
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
    TTSService,
    TeologiaService,
    JwtService,
  ],
  exports: [ChatGptRespuestasService],
})
export class ChatGptRespuestasModule {}
