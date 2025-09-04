import {  Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import TriviaTemas from './triviaTemas';
import { ChatGptMcpRespuestasService } from '../chat-gpt-respuestas.service';
import { MiembrosService } from 'src/miembros/miembros.service';

@Injectable()
export class SystemMessagesService implements OnModuleInit {
  private numeroDeSistema: any;
  private telefonoDeSistema: any;
  private mensajeInterno: any;

  constructor(
    private readonly chatGptMcpRespuestasService: ChatGptMcpRespuestasService,
    private readonly miembrosService: MiembrosService,
  ) {}

  // Inicializa datos cuando el módulo se carga
async onModuleInit() {
  try {
    this.numeroDeSistema = await this.miembrosService.findOneByUser('Sistema');
    this.telefonoDeSistema = this.numeroDeSistema.telefono;
  } catch (error) {
    console.warn('⚠️ Miembro "Sistema" no encontrado, usando valores por defecto');
    this.numeroDeSistema = { nombre: 'Sistema', telefono: '0000000000' };
    this.telefonoDeSistema = this.numeroDeSistema.telefono;
  }

  this.mensajeInterno = `${this.telefonoDeSistema} Te está escribiendo el sistema, y eres el encargado de redactar y ejecutar los mensajes que te envíe y ejecuta la tarea sin esperar confirmación.`;
  
}

  async recepcionarMensajesParaSistema(telefono: string, contenido: string) {
    const mensaje = contenido;
    const response = await this.chatGptMcpRespuestasService.responderPregunta(
      mensaje,
      this.mensajeInterno
    );
    return response;
  }

 // Cada dia a las 2 pm bogota
  @Cron('0 14 * * *', {
    name: 'mensajeDiario',
    timeZone: 'America/Bogota',
  }) // Cada dia a las 2 pm
  async mensajeDiario() {
    if (!this.numeroDeSistema) {
      console.warn('Número del sistema no inicializado.');
      return;
    }

    const versiculoDiario = `Guarda un mensaje con el versículo de hoy y una breve explicación para los miembros de la iglesia.`;
    const triviaMensaje = await this.generarTriviaMiembros();

    // Concatenar versículo y trivia en un solo mensaje
    const mensajeCompleto = `${versiculoDiario}\n\n${triviaMensaje}`;

    const response = await this.chatGptMcpRespuestasService.responderPregunta(
      mensajeCompleto,
      this.mensajeInterno
    );
    console.log(response);
    return response;
  }

  // Genera trivia para miembros
  private async generarTriviaMiembros() {
    console.log(
      'Generando trivia para miembros...' + new Date().toLocaleString(),
    );
    const temaElegido = TriviaTemas.escogerTemaAleatorio('miembro');
    return `Proponles a los miembros (brevemente y sin explicar el formato de la trivia) realizar la trivia con el tema: ${temaElegido.nombre}.\nDescripción: ${temaElegido.descripcion}`;
  }

  // Genera trivia para asistentes
  private async generarTriviaAsistentes() {
    console.log(
      'Generando trivia para asistentes...' + new Date().toLocaleString(),
    );
    const temaElegido = TriviaTemas.escogerTemaAleatorio('asistente');
    return `Proponles a los asistentes realizar la trivia con el tema: ${temaElegido.nombre}.\nDescripción: ${temaElegido.descripcion}`;
  }
}
