import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AseosService } from 'src/aseos/aseos.service';
import { CasasDeFeService } from 'src/casas-de-fe/casas-de-fe.service';
import { EventosService } from 'src/eventos/eventos.service';
import { MiembrosService } from 'src/miembros/miembros.service';
import { TTSService } from 'src/whatsapp-bot/text-to-voice.service';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import { AsistenciasService } from 'src/asistencias/asistencias.service';
import { PeticionesService } from 'src/peticiones/peticiones.service';
import { TeologiaService } from '../services/teologia.service';

@Injectable()
export class ControllerToolService {
  constructor(
    private readonly miembrosService: MiembrosService,
    private readonly textToSpeechService: TTSService,
    private readonly aseoService: AseosService,
    private readonly casasDeFeService: CasasDeFeService,
    private readonly actividadesService: EventosService,
    private readonly teologiaService: TeologiaService,
    private readonly manejoDeMensajesService: ManejoDeMensajesService,
    private readonly asistenciasService: AsistenciasService,
    private readonly peticionesService: PeticionesService,
  ) {}

  // 🔹 Solo expones los que quieres que usen las tools
  getMiembrosService() {
    return this.miembrosService;
  }

  getPeticionesService() {
    return this.peticionesService;
  }

  getAseoService() {
    return this.aseoService;
  }

  getCasasDeFeService() {
    return this.casasDeFeService;
  }

  getEventosService() {
    return this.actividadesService;
  }

  getTeologiaService() {
    return this.teologiaService;
  }

  getAsistenciasService() {
    return this.asistenciasService;
  }

  getTTSService() {
    return this.textToSpeechService;
  }

  getManejoDeMensajesService() {
    return this.manejoDeMensajesService;
  }
}
