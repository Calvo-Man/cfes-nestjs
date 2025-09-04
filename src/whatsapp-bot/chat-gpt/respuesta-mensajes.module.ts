import {  Module } from '@nestjs/common';
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
import { AsistenciasModule } from 'src/asistencias/asistencias.module';
import { ModerationService } from './services/moderation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bloqueo } from './entities/bloqueos.entity';
import { PeticionesModule } from 'src/peticiones/peticiones.module';
import { ControlToolService } from './services/ControlTool.service';
import { ControllerToolService } from './controllers/mcp.controller';
import { ChatGptMcpRespuestasService } from './chat-gpt-respuestas.service';
import { SystemMessagesService } from './services/SystemMessages.service';
import { HistorialMensajes } from './entities/historialMensajes.entity';
import { HistorialMensajesService } from './services/HistorialMensajes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bloqueo,HistorialMensajes]),
    PeticionesModule,
    AseosModule,
    EventosModule,
    ManejoDeMensajesModule,
    MiembrosModule,
    CasasDeFeModule,
    AsistenciasModule,
  ],
  providers: [
    WhatsappBotService,
    SystemMessagesService,
    ChatGptMcpRespuestasService,
    TranscripcionService,
    ModerationService,
    TTSService,
    TeologiaService,
    JwtService,
    ControlToolService,
    ControllerToolService,
    HistorialMensajesService

  ],
  exports: [ ChatGptMcpRespuestasService,SystemMessagesService, HistorialMensajesService],
})
export class ChatGptRespuestasModule {}
