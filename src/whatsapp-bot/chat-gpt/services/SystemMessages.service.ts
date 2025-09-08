import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import TriviaTemas from './triviaTemas';
import { ChatGptMcpRespuestasService } from '../chat-gpt-respuestas.service';
import { MiembrosService } from 'src/miembros/miembros.service';
import { TriviaService } from 'src/sistema-puntajes/trivia.service';

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
      this.numeroDeSistema =
        await this.miembrosService.findOneByUser('Sistema');
      this.telefonoDeSistema = this.numeroDeSistema.telefono;
    } catch (error) {
      console.warn(
        '⚠️ Miembro "Sistema" no encontrado, usando valores por defecto',
      );
      this.numeroDeSistema = { nombre: 'Sistema', telefono: '0000000000' };
      this.telefonoDeSistema = this.numeroDeSistema.telefono;
    }

    this.mensajeInterno = `${this.telefonoDeSistema} Te está escribiendo el sistema, y eres el encargado de redactar y ejecutar los mensajes que te envíe y ejecuta la tarea sin esperar confirmación.`;
  }

  async recepcionarMensajesParaSistema(telefono: string, contenido: string) {
    const mensaje = contenido;
    const response = await this.chatGptMcpRespuestasService.responderPregunta(
      mensaje,
      this.mensajeInterno,
    );
    return response;
  }

  // Cada dia a las 2 pm bogota
  @Cron('0 22 * * *')
  async mensajeDiario() {
    if (!this.numeroDeSistema) {
      console.warn('Número del sistema no inicializado.');
      return;
    }
    const temaElegido = TriviaTemas.escogerTemaAleatorio('miembro');

    const versiculoDiario = `Guarda un mensaje con el versículo de hoy y una breve explicación para los miembros de la iglesia. 
    Tema: ${temaElegido.nombre} .\nDescripción: ${temaElegido.descripcion}.`;
    //const triviaMensaje = await this.generarTriviaMiembros();

    // Concatenar versículo y trivia en un solo mensaje
    //const mensajeCompleto = `${versiculoDiario}\n\n${triviaMensaje}`;

    const response = await this.chatGptMcpRespuestasService.responderPregunta(
      versiculoDiario,
      this.mensajeInterno,
    );
    console.log(response);
    return response;
  }

  @Cron('0 13 * * *')
  async versiculoDiarioAsistentes() {
    console.log('Enviando versículo diario...' + new Date().toLocaleString());
    const temaElegido = TriviaTemas.escogerTemaAleatorio('asistente');
    const mensaje = `
    Guarda un mensaje con el versículo de hoy y una breve explicación para los asistentes de la iglesia y ademas invitalos a realizar la trivia para conocer mas de la palabra.
     tema de la trivia: ${temaElegido.nombre} .\nDescripción: ${temaElegido.descripcion}.
     Importante: Esta es una trivia para asistentes y no la registraras en el sistema.
    `;
    const response = await this.chatGptMcpRespuestasService.responderPregunta(
      mensaje,
      this.mensajeInterno,
    );
    console.log(response);
    return response;
  }

  // Genera trivia para miembros
  @Cron('4 1 * * *')
  private async generarTriviaMiembros() {
    console.log(
      'Generando trivia para miembros...' + new Date().toLocaleString(),
    );
    const temaElegido = TriviaTemas.escogerTemaAleatorio('miembro');
    const triviaMensaje = `📢 Comienza la competencia bíblica. 
Registra en el sistema la trivia del día con el tema: *${temaElegido.nombre}*.
Descripción del tema: ${temaElegido.descripcion}.

Guarda un mensaje para los miembros de la iglesia con lo siguiente;
Anuncia el inicio de la competencia biblica de manera motivadora y explicar brevemente el tema de la trivia de hoy, invitando a los miembros a participar. 
No empieces aún con las preguntas, solo haz la introducción y pregunta quien quiere participar.
Incluye el ID de la trivia en el mensaje.
Recuerda que cada trivia vence automaticamente al finalizar el dia.
Los ganadores serán anunciados los domingos.
`;
    await this.chatGptMcpRespuestasService.responderPregunta(
      triviaMensaje,
      this.mensajeInterno,
    );
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
