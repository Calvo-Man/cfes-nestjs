import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AseosService } from 'src/aseos/aseos.service';
import { CasasDeFeService } from 'src/casas-de-fe/casas-de-fe.service';
import { EventosService } from 'src/eventos/eventos.service';
import { MiembrosService } from 'src/miembros/miembros.service';
import { TTSService } from 'src/whatsapp-bot/text-to-voice.service';
import { TeologiaService } from './teologia.service';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import { AsistenciasService } from 'src/asistencias/asistencias.service';
import { ModerationService } from './moderation.service';
import { PeticionesService } from 'src/peticiones/peticiones.service';
import { Horario } from 'src/miembros/enum/horario.enum';

@Injectable()
export class ControlToolService {
  constructor(
    @Inject(forwardRef(() => MiembrosService))
    private miembrosService: MiembrosService,
    private textToSpeechService: TTSService,
    private aseoService: AseosService,
    private casasDeFeService: CasasDeFeService,
    private actividadesService: EventosService,
    private teologiaService: TeologiaService,
    @Inject(forwardRef(() => ManejoDeMensajesService))
    private manejoDeMensajesService: ManejoDeMensajesService,
    private asistenciasService: AsistenciasService,
    private readonly peticionesService: PeticionesService,
  ) {}

  async guardarPeticionPorAgenteIA(
    contenido: string,
    categoria: string,
    nombre: string,
    telefono: string,
    redaccion: string,
  ): Promise<any> {
    try {
      await this.peticionesService.guardarPeticionPorAgenteIA(
        contenido,
        categoria,
        nombre,
        telefono,
      );
      const miembros = await this.miembrosService.findAll();
      if (!miembros || miembros.miembros.length === 0) return;
      for (const miembro of miembros.miembros) {
        if (miembro.telefono === '573024064896' || miembro.rol === 'pastor' || miembro.cargo === 'Intersección') {
          await this.manejoDeMensajesService.guardarMensaje(
            miembro.telefono,
            redaccion,
            'peticion',
          );
        }
      }
      return {
        audioPath: '',
        text: 'La petición se ha guardado correctamente y se le informará a los miembros para su oración.',
      };
    } catch (error) {
      return {
        audioPath: '',
        text: '⚠️ Lo siento, ocurrió un error al guardar la petición.',
      };
    }
  }
  async obtenerPeticonesPendientes(telefono: string): Promise<any> {
    const miembro = await this.miembrosService.findOneByTelefono(telefono);
    if (!miembro)
      return {
        audioPath: '',
        text: 'Esta información es exclusivamente para miembros.',
      };
    const peticiones = await this.peticionesService.obtenerPendientes();
    return {
      audioPath: '',
      text: peticiones
        .map(
          (p) =>
            `*Nombre:* ${p.nombre}\n*Telefono:* ${p.telefono}\n*Categoria:* ${p.categoria}\n*Contenido:* ${p.contenido}\n`,
        )
        .join('\n'),
    };
  }
async obtenerPeticionesPorMes(telefono: string): Promise<any> {
  const miembro = await this.miembrosService.findOneByTelefono(telefono);
  if (!miembro)
    return {
      audioPath: '',
      text: 'Esta información es exclusivamente para miembros.',
    };
  const peticiones = await this.peticionesService.countPeticionesPorMeses();
  return {
    audioPath: '',
    text: peticiones
      .map((p) => `Fecha: *${p.mes}-${p.anio}* - Peticiones: ${p.total}`)
      .join('\n'),
  };
}
  async countAsistencias(telefono: string): Promise<any> {
    const miembro = await this.miembrosService.findOneByTelefono(telefono);
    if (!miembro)
      return {
        audioPath: '',
        text: 'Esta información es exclusivamente para miembros.',
      };
    const asistencias =
      await this.asistenciasService.countAsistenciasPorMeses();
    return {
      audioPath: '',
      text: asistencias
        .map((a) => `Fecha: *${a.mes}-${a.anio}* - Asistencias: ${a.total}`)
        .join('\n'),
    };
  }

  async buscarRespuestaTeologica(preguntas: string | string[]): Promise<any> {
    // Convertir a array si es un string
    const listaPreguntas = Array.isArray(preguntas) ? preguntas : [preguntas];

    const respuestas =
      await this.teologiaService.buscarRespuestasTeologicasMultiple(
        listaPreguntas,
      );

    const textoFormateado = listaPreguntas
      .map((p) => `❓ *${p}*\n${respuestas[p]}`)
      .join('\n\n');

    return {
      audioPath: '',
      text: textoFormateado,
    };
  }

  async cambiarDiaPreferidoDeAseo(
    telefono: string,
    horario: Horario,
  ): Promise<any> {
    const miembro = await this.miembrosService.findOneByTelefono(telefono);
    if (!miembro)
      return {
        audioPath: '',
        text: 'Parece que no es miembro de la comunidad o no está registrado en la base de datos.',
      };
    try {
      const response = await this.miembrosService.updateHorarioAseoIA(
        miembro.id,
        horario,
      );

      return {
        audioPath: '',
        text: response,
      };
    } catch (error) {
      return {
        audioPath: '',
        text: 'Error al actualizar el horario de aseo del miembro.',
      };
    }
  }

  async consultarMiembro(telefono: string): Promise<any> {
    if (!telefono.startsWith('57')) {
      telefono = '57' + telefono;
    }
    if (telefono.length < 12) {
      return { audioPath: '', text: 'Este número de teléfono no es válido' };
    }
    const miembro = await this.miembrosService.findOneByTelefono(telefono);
    console.log(miembro);
    if (!miembro)
      return {
        audioPath: '',
        text: 'Parece que no es miembro de la comunidad o no está registrado en la base de datos.',
      };
    return {
      audioPath: '',
      text: `Miembro: ${miembro.name} ${miembro.apellido}\nRol: ${miembro.rol}\nTeléfono: ${miembro.telefono.split('57')[1]}
        \nDia en el mes que el miembro seleccionó para disponibilidad de aseo: ${miembro.dia_preferido}
        \nDias en el mes que se hace aseo: Domingos y Jueves.`,
    };
  }
  async cambiarModoRespuesta(telefono: string, modo: string): Promise<any> {
    try {
      const respuesta = await this.miembrosService.cambiarModoRespuesta(
        telefono,
        modo,
      );
      console.log('MODO DE RESPUESTA: ', respuesta);
      return {
        audioPath: '',
        text: respuesta,
      };
    } catch (error) {
      console.error(error);
      return {
        audioPath: '',
        text: 'Lo siento, no me encuentro disponible por el momento.',
      };
    }
  }
  async obtenerModoRespuesta(telefono: string): Promise<string> {
    const modo = await this.miembrosService.obtenerModoRespuesta(telefono);
    return modo || 'texto';
  }

  async consultarDiasDeAseo(telefono: string): Promise<any> {
    if (!telefono.startsWith('57')) {
      telefono = '57' + telefono;
    }
    if (telefono.length < 12) {
      return { audioPath: '', text: 'Este número de teléfono no es válido' };
    }
    const miembro = await this.miembrosService.findOneByTelefono(telefono);
    if (!miembro)
      return {
        audioPath: '',
        text: 'Usuario no registrado en la base de datos.',
      };

    const asignaciones =
      await this.aseoService.findAsignedAseosCurrentMonthById(miembro.id);
    if (!asignaciones.length)
      return {
        audioPath: '',
        text: 'No tienes asignaciones de aseo por ahora (Sugiere buscar en "consultar_dias_aseo_mes_siguiente").',
      };

    const fechas = asignaciones.map((a) => a.fecha).join(', ');
    return {
      audioPath: '',
      text: `Te corresponde hacer aseo los días: ${fechas}. ¡Gracias por tu servicio! 🙌`,
    };
  }

  async consultarDiaAseoMesSiguiente(telefono: string): Promise<any> {
    if (!telefono.startsWith('57')) {
      telefono = '57' + telefono;
    }
    if (telefono.length < 12) {
      return { audioPath: '', text: 'Este número de teléfono no es válido' };
    }
    const miembro = await this.miembrosService.findOneByTelefono(telefono);
    if (!miembro)
      return {
        audioPath: '',
        text: 'Usuario no registrado en la base de datos.',
      };

    const asignaciones = await this.aseoService.findAsignedAseosNextMonthById(
      miembro.id,
    );
    if (!asignaciones.length)
      return {
        audioPath: '',
        text: 'No tienes asignaciones de aseo por ahora.',
      };

    const fechas = asignaciones.map((a) => a.fecha).join(', ');
    return {
      audioPath: '',
      text: `Te corresponde hacer aseo los días: ${fechas}. ¡Gracias por tu servicio! 🙌`,
    };
  }
  async consultarEncargadosAseosPorFechas(fechas: string[]): Promise<any> {
    const encargados =
      await this.aseoService.buscarEncargadosdeAseoPorFechas(fechas);
    console.log(encargados);
    if (!encargados.length)
      return {
        audioPath: '',
        text: 'No hay encargados disponibles para esta semana.',
      };

    return {
      audioPath: '',
      text: `📌 Encargados de aseo:\n 
        ${encargados.map((e) => `fecha: ${e.fecha} - nombre: ${e.nombre} - apellido: ${e.apellido} - telefono: ${e.telefono}`).join('\n')}`,
    };
  }
  async consultarActividadesMes(mes: string): Promise<any> {
    const actividades = await this.actividadesService.findAllAgrupadoPorMes();
    console.log(actividades);

    if (!actividades[mes])
      return {
        audioPath: '',
        text: `No hay actividades disponibles para ${mes}.`,
      };

    return {
      audioPath: '',
      text:
        `📌 Actividades para ${mes}:\n` +
        actividades[mes]
          .map(
            (a: { name: any; description: any; date: any }) =>
              `\n-Nombre: ${a.name}\n-Descripción: ${a.description}\n-Fecha: ${a.date}`,
          )
          .join('\n'),
    };
  }

  async consultarCasasDeFe(): Promise<any> {
    const casas = await this.casasDeFeService.findAll();
    if (!casas.length)
      return {
        audioPath: '',
        text: 'No hay casas de fe disponibles por ahora.',
      };

    return {
      audioPath: '',
      text:
        '🏠 Casas de fe disponibles:\n' +
        casas
          .map(
            (c) =>
              `\n-Dirección de la casa de fe: ${c.direccion}\n-Nombre de la casa de fe: ${c.nombre}\nCategoría de la casa de fe: ${c.categoria}\n-Encargados de la casa de fe: (${c.encargadosId.map((e) => [e.name, e.apellido, e.rol, e.telefono])}`,
          )
          .join('\n'),
    };
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
