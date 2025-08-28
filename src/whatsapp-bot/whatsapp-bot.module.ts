import {  Module } from '@nestjs/common';
import { WhatsappBotService } from './whatsapp-bot.service';
import { ManejoDeMensajesModule } from 'src/manejo-de-mensajes/manejo-de-mensajes.module';
import { MiembrosModule } from 'src/miembros/miembros.module';
import { TranscripcionService } from './voice-to-text.service';
import { ContratosModule } from 'src/contratos/contratos.module';
import { TeologiaService } from './chat-gpt/services/teologia.service';
import { TeologiaController } from './chat-gpt/controllers/teologia.controller';
import { JwtService } from '@nestjs/jwt';
import { ChatGptRespuestasModule } from './chat-gpt/respuesta-mensajes.module';


@Module({
  imports: [
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
    TranscripcionService,
    TeologiaService,
    JwtService
  ],
  exports: [WhatsappBotService],
})
export class WhatsappBotModule {}
