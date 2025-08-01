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

@Injectable()
export class ChatGptRespuestasService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private diaActual = new Date();

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
  ) {}

  async responderPregunta(mensaje: string, telefono: string): Promise<any> {
    try {
      if (!this.historiales[telefono]) {
        this.historiales[telefono] = [
          {
            role: 'system',
            content: systemPromptFunction(
              this.diaActual,
              telefono,
              await this.obtenerModoRespuesta(telefono),
            ),
          },
        ];
      }

      this.historiales[telefono].push({ role: 'user', content: mensaje });

      if (this.historiales[telefono].length > 10) {
        this.historiales[telefono] = this.historiales[telefono].slice(-5);
      }

      const tools: OpenAI.Chat.ChatCompletionTool[] =
        ChatMessageParam as OpenAI.Chat.ChatCompletionTool[];

      const chat = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: this.historiales[telefono],
        tools,
        tool_choice: 'auto',
      });

      const choice = chat.choices[0];
      const toolCalls = choice.message.tool_calls;

      console.log('Choice: ', choice);

      if (
        toolCalls &&
        toolCalls.length > 0 &&
        choice.finish_reason === 'tool_calls'
      ) {
        const toolResults: string[] = [];

        // ✅ Agrega solo una vez la respuesta del assistant con tool_calls
        this.historiales[telefono].push(choice.message);
        //console.log('Tool Calls: ', toolCalls);
        for (const toolCall of toolCalls) {
          const args = JSON.parse(toolCall.function.arguments);
          //console.log('Args: ', args);
          let resultado = { audioPath: '', text: '' };
          console.log(toolCall.function.name);
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
              resultado = await this.buscarRespuestaTeologica(args.pregunta);
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
            default:
              resultado = {
                audioPath: '',
                text: 'No se pudo obtener la información solicitada.',
              };
          }
          //console.log('resultado', resultado);
          toolResults.push(resultado.text);

          this.historiales[telefono].push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: resultado.text,
          });
        }

        //console.log('this.historiales[telefono] ', this.historiales[telefono]);
        //console.log('choice.message ', choice.message);

        const segundaRespuesta = await this.openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: this.historiales[telefono],
        });

        const respuestaFinal =
          segundaRespuesta.choices[0].message.content ?? '';
        const modoRespuesta = await this.obtenerModoRespuesta(telefono);
        //console.log('modoRespuesta', modoRespuesta);
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
      } else {
        const segundaRespuesta = await this.openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: this.historiales[telefono],
        });

        const respuestaFinal =
          segundaRespuesta.choices[0].message.content ?? '';

        this.historiales[telefono].push({
          role: 'assistant',
          content: respuestaFinal,
        });
        const modoRespuesta = await this.obtenerModoRespuesta(telefono);
        console.log('modoRespuesta', modoRespuesta);

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
    } catch (error) {
      console.error(error);
      return {
        audioPath: '',
        text: 'Lo siento, no me encuentro disponible por el momento.',
      };
    }
  }
  private async buscarRespuestaTeologica(pregunta: string): Promise<any> {
    const respuesta =
      await this.teologiaService.buscarRespuestasTeologicas(pregunta);
    console.log('Respuesta teologica: ', respuesta);
    return {
      audioPath: '',
      text: respuesta,
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
}
