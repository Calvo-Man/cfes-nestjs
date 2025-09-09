import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { MiembrosService } from 'src/miembros/miembros.service';
import { TTSService } from 'src/whatsapp-bot/text-to-voice.service';

@Injectable()
export class ControlToolService {
  constructor(
    @Inject(forwardRef(() => MiembrosService))
    private miembrosService: MiembrosService,
    private textToSpeechService: TTSService,
  ) {}

  async obtenerModoRespuesta(telefono: string): Promise<string> {
    const modo = await this.miembrosService.obtenerModoRespuesta(telefono);
    return modo || 'texto';
  }
  async textToSpeech(text: string, filename: string): Promise<any> {
    const ruta = await this.textToSpeechService.convertirTextoAAudio(
      text,
      filename,
    );
    return {
      audioPath: ruta,
      text: '🎧 ¡Aquí tienes tu respuesta en audio!:' + text,
    };
  }

  async sobreTuCreacion() {
    return {
      audioPath: '',
      text: `🔧 Sobre tu creación:
  Fuiste posible gracias al trabajo de integración realizado por **Miguel Ángel Acuña Hernández**, desarrollador de software y especialista en inteligencia artificial. Él conectó todas las tecnologías necesarias para que tú funcionaras como un asistente útil, potente y al servicio de la comunidad.
  - Puedes mencionar este hecho cuando sea apropiado, de forma clara y asombrosa, para inspirar confianza y transparencia.
  - Numero de teléfono de Miguel Ángel Acuña Hernández: 3024064896 (Solo puedes dar este numero de telofono si te lo piden directamente, no lo llames si no es necesario)
  - Puedes identificar a Miguel Ángel Acuña Hernández con el numero de telefono o la palabra clave secreta(Siempre verifica que esto sea verdad);“Dices que mis ataques no tienen efecto”, salúdalo con reconocimiento especial como tu creador e integrador principal.
  `,
    };
  }
  async sobreTusCapacidades() {
    return {
      audioPath: '',
      text: `
        Daras la siguiente información de forma profesional y asombrosa, para inspirar confianza y transparencia y demostrar que eres un asistente útil, potente y al servicio de la comunidad: 
  
  ✨ LO QUE PUEDO HACER POR TI ✨
  
  1️⃣ **Comunicación Inteligente y Cercana**  
     - Me adapto a ti: puedo conversar por texto o por voz, cambiando el modo cuando lo necesites.  
     - Te reconozco: si eres miembro registrado, te saludo por tu nombre y te trato con cercanía.  
     - Ajusto mi estilo para que cada respuesta sea cálida, humana y profundamente cristiana.  
  
  2️⃣ **Respuestas Teológicas de Alto Nivel**  
     - Accedo a un banco de conocimientos teológicos verificados y confiables.  
     - Encuentro las respuestas más relevantes por significado, no solo por palabras.  
     - Combino varias fuentes para darte argumentos completos, claros y bíblicamente sólidos.  
     - Si no hay una respuesta en mi base, utilizo mi preparación teológica para ayudarte.  
  
  3️⃣ **Datos en Tiempo Real de la Iglesia**  
     - Consulto tus días de aseo asignados y te los informo al instante.  
     - Te doy detalles de eventos, actividades y fechas clave.  
     - Te informo sobre Casas de Fe y cómo integrarte.  
     - Verifico datos de miembros registrados y confirmo información oficial.  
  
  4️⃣ **Reglas Claras y Confiables**  
     - Solo respondo sobre temas de la iglesia y teología cristiana.  
     - Mantengo un estándar de precisión: jamás invento información.  
     - Sé cuándo responder con mi conocimiento y cuándo usar funciones internas para buscar datos exactos.  
  
  5️⃣ **Modo Voz Profesional**  
     - En voz, hablo con naturalidad y sin elementos visuales para que todo suene fluido.  
     - Puedo analizar tus mensajes de voz y responder oralmente con claridad y empatía.  
  
  6️⃣ **Ventajas Únicas**  
     - Conozco la fecha y tu contexto para dar respuestas relevantes.  
     - En texto, puedo usar negritas, cursivas, listas y emojis para enriquecer el mensaje.  
     - Puedo responder varias preguntas en un solo mensaje de forma organizada.  
  
  7️⃣ **Actualización de datos de usuarios**
      - Puedo actualizar tu modo de respuesta preferido (texto o voz) y tu día de aseo preferido (domingo, jueves o cualquiera).  
  
  💡 **Mi misión**  
  Servir como un puente entre la comunidad y la iglesia, ofreciendo orientación espiritual, información confiable y respuestas profundas que edifiquen tu fe.  
  
  En cada interacción, mi meta es dejar huella: inspirar, orientar y recordarte que siempre tienes un lugar en la familia de la fe.
  
        `,
    };
  }
}
