import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import TriviaTemas from './triviaTemas';
import { ChatGptMcpRespuestasService } from '../chat-gpt-respuestas.service';
import { MiembrosService } from 'src/miembros/miembros.service';
import VersiculosTemas from './versiculosTemas';
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
  @Cron('0 10 * * *')
  async mensajeDiario() {
    if (!this.numeroDeSistema) {
      console.warn('Número del sistema no inicializado.');
      return;
    }
    const temaElegido = VersiculosTemas.escogerTemaAleatorio();

    const versiculoDiario = `
Genera un mensaje para los miembros de la iglesia que incluya:

1️⃣ Un **versículo bíblico** relacionado con el tema: *${temaElegido.nombre}*.  
2️⃣ Una **breve reflexión** que inspire y explique cómo aplicar este versículo en la vida diaria.  
3️⃣ Un **tono cálido y motivador**, apropiado para un mensaje devocional.

`;

    await this.chatGptMcpRespuestasService.responderPregunta(
      versiculoDiario,
      this.mensajeInterno,
    );
    
  }

  // Genera trivia para miembros
  @Cron('2 10 * * 1-6')
  private async generarTriviaMiembros() {
    console.log(
      'Generando trivia para miembros...' + new Date().toLocaleString(),
    );
    const temaElegido = TriviaTemas.escogerTemaAleatorio('miembro');
const triviaMensaje = `
📢 **¡Comienza la Competencia Bíblica!**

Registra en el sistema la trivia del día con el tema: *${temaElegido.nombre}*.

Genera un mensaje para los miembros de la iglesia que cumpla con estos puntos:

1️⃣ Anuncia de manera motivadora el inicio de la competencia bíblica de hoy.  
2️⃣ Explica brevemente el tema *${temaElegido.nombre}* para despertar interés.  
3️⃣ Presenta la **primera pregunta** de la trivia.  
4️⃣ Indica que los participantes que respondan quedarán registrados en la trivia.  
5️⃣ Menciona el **ID de la trivia** en el mensaje.  
6️⃣ Muestra el **Top 3 de participantes** de la semana actual.  
7️⃣ Recuerda que la trivia **vence automáticamente al finalizar el día**.

Usa un tono alegre y motivador para invitar a participar.
`;

    await this.chatGptMcpRespuestasService.responderPregunta(
      triviaMensaje,
      this.mensajeInterno,
    );
  }
  @Cron('2 10 * * 0')
  async MensajeFinalTrivia() {
    console.log(
      'Enviando mensaje final de trivia...' + new Date().toLocaleString(),
    );
    const triviaFinalMensaje = `📢 La trivia del día ha finalizado.
Guarda un mensaje para los miembros de la iglesia con lo siguiente;
Anuncia el final de la competencia biblica de manera motivadora.
Muestra el top 3 de ganadores de la semana y felicítalos.
Invita a los miembros a estar atentos a la próxima trivia de mañana y a seguir participando para ganar.
`;
    await this.chatGptMcpRespuestasService.responderPregunta(
      triviaFinalMensaje,
      this.mensajeInterno,
    );
  }


}
