import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { AseosService } from 'src/aseos/aseos.service';
import { CasasDeFeService } from 'src/casas-de-fe/casas-de-fe.service';
import { EventosService } from 'src/eventos/eventos.service';
import { MiembrosService } from 'src/miembros/miembros.service';
import { TTSService } from '../text-to-voice.service';
import systemPromptFunction from './system-prompt';
import { ChatMessageParam } from './services/functionsChat';
import { TeologiaService } from './services/teologia.service';
import { Horario } from 'src/miembros/enum/horario.enum';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';

@Injectable()
export class ChatGptRespuestasService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private enviadosHoy: Set<string> = new Set();

  private historiales: Record<
    string,
    OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  > = {};

  constructor(
    private miembrosService: MiembrosService,
    private textToSpeechService: TTSService,
    private aseoService: AseosService,
    private casasDeFeService: CasasDeFeService,
    private actividadesService: EventosService,
    private teologiaService: TeologiaService,
    private manejoDeMensajesService: ManejoDeMensajesService,
  ) {}

  async responderPregunta(mensaje: string, telefono: string): Promise<any> {
    try {
      // 🟢 Actualiza o crea el system prompt según el modo actual
      if (!this.historiales[telefono]) {
        this.historiales[telefono] = [
          {
            role: 'system',
            content: systemPromptFunction(
              new Date(),
              telefono,
              await this.obtenerModoRespuesta(telefono),
            ),
          },
        ];
      } else {
        this.historiales[telefono][0] = {
          role: 'system',
          content: systemPromptFunction(
            new Date(),
            telefono,
            await this.obtenerModoRespuesta(telefono),
          ),
        };
      }

      console.log(
        'Historiales antes de la pregunta:',
        this.historiales[telefono],
      );

      // 🟡 Después agregas el mensaje del usuario
      this.historiales[telefono].push({
        role: 'user',
        content: mensaje,
      });

      // 🧹 Limpieza del historial si es muy largo
      if (this.historiales[telefono].length > 15) {
        this.historiales[telefono] = this.historiales[telefono].slice(-5);
      }

      // ⚒️ Tools disponibles
      const tools: OpenAI.Chat.ChatCompletionTool[] =
        ChatMessageParam as OpenAI.Chat.ChatCompletionTool[];

      // 🧠 Primera llamada a OpenAI
      const chat = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: this.historiales[telefono],
        tools,
        tool_choice: 'auto',
      });

      const choice = chat.choices[0];
      const toolCalls = choice.message.tool_calls;

      // 🔧 Si el modelo pidió ejecutar herramientas
      if (
        toolCalls &&
        toolCalls.length > 0 &&
        choice.finish_reason === 'tool_calls'
      ) {
        // 🔁 Guarda el mensaje del modelo que solicitó tools
        this.historiales[telefono].push(choice.message);

        for (const toolCall of toolCalls) {
          let args: any;
          let resultado = { audioPath: '', text: '' };

          // 🛡 Parseo seguro de argumentos
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch (error) {
            console.error(
              `❌ Error al parsear argumentos para ${toolCall.function.name}:`,
              error,
            );
            this.historiales[telefono].push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: '⚠️ No pude entender los datos solicitados.',
            });
            continue;
          }

          // 🛠 Ejecuta la función correspondiente
          try {
            switch (toolCall.function.name) {
              case 'consultar_dias_aseo_mes_actual':
                resultado = await this.consultarDiasDeAseo(args.telefono);
                break;
              case 'consultar_dias_aseo_mes_siguiente':
                resultado = await this.consultarDiaAseoMesSiguiente(
                  args.telefono,
                );
                break;
              case 'consultar_encargados_aseos_por_fechas':
                resultado = await this.consultarEncargadosAseosPorFechas(
                  args.fechas,
                );
                break;
              case 'consultar_casas_fe':
                resultado = await this.consultarCasasDeFe();
                break;
              case 'consultar_actividades_por_mes':
                resultado = await this.consultarActividadesMes(args.mes);
                break;
              case 'consultar_datos_miembro':
                resultado = await this.consultarMiembro(args.telefono);
                break;
              case 'sobre_tu_creacion':
                resultado = await this.sobreTuCreacion();
                break;
              case 'buscarRespuestaTeologica':
                resultado = await this.buscarRespuestaTeologica(args.preguntas);
                break;
              case 'cambiar_modo_respuesta':
                resultado = await this.cambiarModoRespuesta(
                  args.telefono,
                  args.modo,
                );
                break;
              case 'cambiar_dia_de_aseo_preferido':
                resultado = await this.cambiarDiaPreferidoDeAseo(
                  args.telefono,
                  args.horario,
                );
                break;
              case 'sobre_tus_capacidades':
                resultado = await this.sobreTusCapacidades();
                break;
              default:
                resultado = {
                  audioPath: '',
                  text: '⚠️ Esta herramienta no está disponible.',
                };
            }

            // 📨 Agrega la respuesta de la herramienta
            this.historiales[telefono].push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: resultado.text,
            });
          } catch (error) {
            console.error(
              `❌ Error al ejecutar la tool ${toolCall.function.name}:`,
              error,
            );
            this.historiales[telefono].push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: '⚠️ Ocurrió un error al procesar tu solicitud.',
            });
          }

          console.log(
            `✅ Tool llamada: ${toolCall.function.name} con args:`,
            args,
          );
          console.log(
            `📤 Resultado de la tool ${toolCall.function.name}:`,
            resultado,
          );
        }

        // 📞 Segunda llamada con resultados de tools
        let respuestaFinal = '';
        try {
          const segundaRespuesta = await this.openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: this.historiales[telefono],
          });
          respuestaFinal = segundaRespuesta.choices[0].message.content ?? '';
          this.historiales[telefono].push({
            role: 'assistant',
            content: respuestaFinal,
          });
        } catch (error) {
          console.error(
            '❌ Error al obtener segunda respuesta de OpenAI:',
            error,
          );
          respuestaFinal =
            '⚠️ Lo siento, ocurrió un error al generar la respuesta final.';
        }

        // 🔊 Si el modo es voz, convertir a audio
        const modoRespuesta = await this.obtenerModoRespuesta(telefono);
        if (modoRespuesta === 'voz') {
          const nombreFileName = `${telefono}_${Date.now()}`;
          const rutaAudio = await this.textToSpeech(
            respuestaFinal,
            nombreFileName,
          );
          return {
            audioPath: rutaAudio.audioPath,
            text: rutaAudio.text,
          };
        }

        return {
          audioPath: '',
          text: respuestaFinal,
        };
      }

      // ✅ Si no se usaron herramientas, respuesta directa
      const respuestaFinal = choice.message.content ?? '';
      this.historiales[telefono].push({
        role: 'assistant',
        content: respuestaFinal,
      });

      const modoRespuesta = await this.obtenerModoRespuesta(telefono);
      if (modoRespuesta === 'voz') {
        const nombreFileName = `${telefono}_${Date.now()}`;
        const rutaAudio = await this.textToSpeech(
          respuestaFinal,
          nombreFileName,
        );
        return {
          audioPath: rutaAudio.audioPath,
          text: rutaAudio.text,
        };
      }

      return {
        audioPath: '',
        text: respuestaFinal,
      };
    } catch (error) {
      console.error('❌ Error general en responderPregunta:', error);
      // Intentar enviar un mensaje de error al usuario
      this.historiales[telefono].push({
        role: 'assistant',
        content: '⚠️ Lo siento, ocurrió un error al generar la respuesta.',
      });
      const errorRespuesta = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: this.historiales[telefono],
      });
      return {
        audioPath: '',
        text: errorRespuesta.choices[0].message.content ?? '',
      };
    }
  }

 
  @Interval(60000) // Cada 1 minuto
  private async generarTrivia() {
    console.log('Generando trivia...' + new Date().toLocaleString());
    const miembrosHoy = new Date().getDate();
    const miembros = await this.miembrosService.findAll();
    if (!miembros || miembros.miembros.length === 0) return;
    console.log('Miembros encontrados: ', miembros.miembros);

    let i = 0;
    for (const miembro of miembros.miembros) {
      const key = `${miembro.telefono}_${miembrosHoy}`;
      console.log('key: ', this.enviadosHoy);
      if (this.enviadosHoy.has(key)) {
        console.log(
          `⚠️ Ya se envió trivia a ${miembro.name} (${miembro.telefono})`,
        );
        continue;
      }
      this.enviadosHoy.add(key);
      console.log('Mensajes enviados: ', (i = ++i));
      // Marca como enviado
      if (!this.historiales[miembro.telefono]) {
        this.historiales[miembro.telefono] = [
          {
            role: 'system',
            content: systemPromptFunction(
              new Date(),
              miembro.telefono,
              'texto',
            ),
          },
        ];
      }
      const mensaje = `¡Hola, ${miembro.name}! 🙌 Hoy quiero retarte con unas preguntitas bíblica que te hará pensar y fortalecer tu fe.
¿Listo para responder la trivia del día?
📖✨ ¡Vamos a aprender juntos del gran amor de Dios!  `;
      this.historiales[miembro.telefono].push({
        role: 'assistant',
        content: mensaje,
      });

      await this.manejoDeMensajesService.guardarMensaje(
        miembro.telefono,
        mensaje,
        'texto',
      );

      console.log(`✅ Trivia enviada a ${miembro.name} (${miembro.telefono})`);
    }
  }
  private async buscarRespuestaTeologica(
    preguntas: string | string[],
  ): Promise<any> {
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

  private async cambiarDiaPreferidoDeAseo(
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

  private async consultarMiembro(telefono: string): Promise<any> {
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
      \nDia en el mes que el miembro seleccionó para disponibilidad de aseo: ${miembro.horario_aseo}
      \nDias en el mes que se hace aseo: Domingos y Jueves.`,
    };
  }
  private async cambiarModoRespuesta(
    telefono: string,
    modo: string,
  ): Promise<any> {
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
  private async obtenerModoRespuesta(telefono: string): Promise<string> {
    const modo = await this.miembrosService.obtenerModoRespuesta(telefono);
    return modo;
  }

  private async consultarDiasDeAseo(telefono: string): Promise<any> {
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

  private async consultarDiaAseoMesSiguiente(telefono: string): Promise<any> {
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
  private async consultarEncargadosAseosPorFechas(
    fechas: string[],
  ): Promise<any> {
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
  private async consultarActividadesMes(mes: string): Promise<any> {
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

  private async consultarCasasDeFe(): Promise<any> {
    const casas = await this.casasDeFeService.findAll();
    if (!casas.length)
      return {
        audioPath: '',
        text: 'No hay casas de fe disponibles para esta semana.',
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
  private async textToSpeech(text: string, filename: string): Promise<any> {
    const ruta = await this.textToSpeechService.convertirTextoAAudio(
      text,
      filename,
    );
    return {
      audioPath: ruta,
      text: '🎧 ¡Aquí tienes tu respuesta en audio!:' + text,
    };
  }

  private async sobreTuCreacion() {
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
  private async sobreTusCapacidades() {
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
