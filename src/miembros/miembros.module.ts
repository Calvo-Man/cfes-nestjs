import { forwardRef, Module } from '@nestjs/common';
import { MiembrosService } from './miembros.service';
import { MiembrosController } from './miembros.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Miembro } from './entities/miembro.entity';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from 'src/roles/role-guard/role.guard';
import { Aseo } from 'src/aseos/entities/aseo.entity';
import { WhatsappBotModule } from 'src/whatsapp-bot/whatsapp-bot.module';
import { WhatsappBotService } from 'src/whatsapp-bot/whatsapp-bot.service';
import { ManejoDeMensajesModule } from 'src/manejo-de-mensajes/manejo-de-mensajes.module';
import { ChatGptRespuestasService } from 'src/whatsapp-bot/chat-gpt/respuesta-mensajes.service';
import { AseosService } from 'src/aseos/aseos.service';
import { EventosModule } from 'src/eventos/eventos.module';
import { CasasDeFeService } from 'src/casas-de-fe/casas-de-fe.service';
import { CasasDeFe } from 'src/casas-de-fe/entities/casas-de-fe.entity';
import { GeocodingService } from 'src/geolocalizacion/geocoding.service';
import { OpenRouteService } from 'src/geolocalizacion/openroute.service';
import { OpenCageService } from 'src/geolocalizacion/opencage.service';
import { TTSService } from 'src/whatsapp-bot/text-to-voice.service';
import { ContratosModule } from 'src/contratos/contratos.module';
import { ContratosService } from 'src/contratos/contratos.service';
import { Contrato } from 'src/contratos/entities/contrato.entity';
import { TeologiaService } from 'src/whatsapp-bot/chat-gpt/services/teologia.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Miembro, Aseo, CasasDeFe,Contrato]),
    ManejoDeMensajesModule,
    ContratosModule,
    forwardRef(() => EventosModule),
  ],
  controllers: [MiembrosController],
  providers: [
    MiembrosService,
    ContratosService,
    JwtService,
    RolesGuard,
    ChatGptRespuestasService,
    AseosService,
    CasasDeFeService,
    GeocodingService,
    OpenRouteService,
    OpenCageService,
    TTSService,
    TeologiaService
  ],
  exports: [MiembrosService],
})
export class MiembrosModule {}
