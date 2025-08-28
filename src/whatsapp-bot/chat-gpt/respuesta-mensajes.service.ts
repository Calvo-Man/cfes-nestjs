import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { MiembrosService } from 'src/miembros/miembros.service';
import systemPromptFunction from './system-prompt';
import { ChatMessageParam } from './services/functionsChat';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import TriviaTemas from './services/triviaTemas';
import { AsistenciasService } from 'src/asistencias/asistencias.service';
import { ModerationService } from './services/moderation.service';
import { ControlToolService } from './services/ControlTool.service';
import { In } from 'typeorm';

@Injectable()
export class ChatGptRespuestasService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private enviadosHoy: Set<string> = new Set();

  private historiales: Record<
    string,
    OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  > = {};

  constructor(
    @Inject(forwardRef(() => MiembrosService))
    private miembrosService: MiembrosService,
    private manejoDeMensajesService: ManejoDeMensajesService,
    private asistenciasService: AsistenciasService,
    private readonly moderationService: ModerationService,
    private readonly controlToolService: ControlToolService,
  ) {}

  async responderPregunta(mensaje: string, telefono: string): Promise<any> {
    try {
      // 🔹 Inicializa historial si no existe
      if (!this.historiales[telefono]) {
        this.historiales[telefono] = [
          {
            role: 'system',
            content: systemPromptFunction(
              new Date(),
              telefono,
              await this.controlToolService.obtenerModoRespuesta(telefono),
            ),
          },
        ];
      }

      // 🔹 Moderación de mensaje
      const moderacion = await this.moderationService.verificarMensaje(
        telefono,
        mensaje,
      );
      if (moderacion) {
        this.historiales[telefono][0].content = systemPromptFunction(
          new Date(),
          telefono,
          await this.controlToolService.obtenerModoRespuesta(telefono),
          moderacion,
        );
      }

      // 🔹 Agrega mensaje del usuario
      this.historiales[telefono].push({ role: 'user', content: mensaje });

      // 🔹 Mantener historial corto sin borrar el system prompt
      if (this.historiales[telefono].length > 45) {
        const systemPrompt = this.historiales[telefono][0]; // el primer mensaje (system)
        const resto = this.historiales[telefono].slice(-20); // últimos 20 mensajes reales
        this.historiales[telefono] = [systemPrompt, ...resto]; // reconstruir historial
      }

      // Tools disponibles
      const tools: OpenAI.Chat.ChatCompletionTool[] =
        ChatMessageParam as OpenAI.Chat.ChatCompletionTool[];
      // Primera llamada al modelo
      const chat = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: this.historiales[telefono],
        tools,
        tool_choice: 'auto',
      });
      const choice = chat.choices[0].message;
      const toolCalls = choice.tool_calls ?? [];
      //  Guardar la respuesta del modelo (con tool_calls) ANTES de ejecutar nada
      this.historiales[telefono].push(choice);
      //  Si hay tools que ejecutar
      if (
        toolCalls.length > 0 &&
        chat.choices[0].finish_reason === 'tool_calls'
      ) {
        for (const toolCall of toolCalls) {
          let args: any;
          let resultado = { audioPath: '', text: '' };

          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch (error) {
            args = {};
            console.error('Error parseando toolCall.arguments:', error);
          }

          // 🔹 Ejecuta la tool correspondiente
          try {
            switch (toolCall.function.name) {
              case 'obtener_asistencias_por_mes':
                resultado = await this.controlToolService.countAsistencias(
                  args.telefono,
                );
                break;
              case 'obtener_peticiones_pendientes':
                resultado =
                  await this.controlToolService.obtenerPeticonesPendientes(args.telefono);
                break;
              case 'obtener_peticiones_por_mes':
                resultado =
                  await this.controlToolService.obtenerPeticionesPorMes(
                    args.telefono,
                  );
                break;
              case 'guardar_peticion_de_oracion':
                resultado =
                  await this.controlToolService.guardarPeticionPorAgenteIA(
                    args.contenido,
                    args.categoria,
                    args.nombre,
                    args.telefono,
                    args.redaccion,
                  );
                break;
              case 'consultar_dias_aseo_mes_actual':
                resultado = await this.controlToolService.consultarDiasDeAseo(
                  args.telefono,
                );
                break;
              case 'consultar_dias_aseo_mes_siguiente':
                resultado =
                  await this.controlToolService.consultarDiaAseoMesSiguiente(
                    args.telefono,
                  );
                break;
              case 'consultar_encargados_aseos_por_fechas':
                resultado =
                  await this.controlToolService.consultarEncargadosAseosPorFechas(
                    args.fechas,
                  );
                break;
              case 'consultar_casas_fe':
                resultado = await this.controlToolService.consultarCasasDeFe();
                break;
              case 'consultar_actividades_por_mes':
                resultado =
                  await this.controlToolService.consultarActividadesMes(
                    args.mes,
                  );
                break;
              case 'consultar_datos_miembro':
                resultado = await this.controlToolService.consultarMiembro(
                  args.telefono,
                );
                break;
              case 'sobre_tu_creacion':
                resultado = await this.controlToolService.sobreTuCreacion();
                break;
              case 'buscarRespuestaTeologica':
                resultado =
                  await this.controlToolService.buscarRespuestaTeologica(
                    args.preguntas,
                  );
                break;
              case 'cambiar_modo_respuesta':
                resultado = await this.controlToolService.cambiarModoRespuesta(
                  args.telefono,
                  args.modo,
                );
                break;
              case 'cambiar_dia_de_aseo_preferido':
                resultado =
                  await this.controlToolService.cambiarDiaPreferidoDeAseo(
                    args.telefono,
                    args.horario,
                  );
                break;
              case 'sobre_tus_capacidades':
                resultado = await this.controlToolService.sobreTusCapacidades();
                break;
              default:
                resultado = {
                  audioPath: '',
                  text: '⚠️ Herramienta no disponible',
                };
            }
          } catch (error) {
            console.error(
              'Error ejecutando tool:',
              toolCall.function.name,
              error,
            );
            resultado = {
              audioPath: '',
              text: '⚠️ Error al procesar la herramienta',
            };
          }

          // 🔹 Agrega mensaje tipo tool al historial
          this.historiales[telefono].push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: resultado.text,
          });
          console.log('🔹 Agrega mensaje tipo tool al historial: ', {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: resultado.text,
          });

          // 🔹 Actualiza sistema si cambió modo de respuesta
          if (toolCall.function.name === 'cambiar_modo_respuesta') {
            this.historiales[telefono][0].content = systemPromptFunction(
              new Date(),
              telefono,
              await this.controlToolService.obtenerModoRespuesta(telefono),
            );
          }
        }

        // 🔹 Segunda llamada al modelo después de ejecutar todas las tools
        const segundaRespuesta = await this.openai.chat.completions.create({
          model: 'gpt-5-mini',
          messages: this.historiales[telefono],
        });

        const respuestaFinal =
          segundaRespuesta.choices[0].message.content ?? '';
        this.historiales[telefono].push({
          role: 'assistant',
          content: respuestaFinal,
        });

        // 🔹 Convertir a audio si corresponde
        if (
          (await this.controlToolService.obtenerModoRespuesta(telefono)) ===
          'voz'
        ) {
          const nombreFileName = `${telefono}_${Date.now()}`;
          const rutaAudio = await this.controlToolService.textToSpeech(
            respuestaFinal,
            nombreFileName,
          );
          return { audioPath: rutaAudio.audioPath, text: rutaAudio.text };
        }

        return { audioPath: '', text: respuestaFinal };
      }

      // 🔹 Respuesta normal si no se usan tools
      const respuestaNormal = choice.content ?? '';
      this.historiales[telefono].push({
        role: 'assistant',
        content: respuestaNormal,
      });

      if (
        (await this.controlToolService.obtenerModoRespuesta(telefono)) === 'voz'
      ) {
        const nombreFileName = `${telefono}_${Date.now()}`;
        const rutaAudio = await this.controlToolService.textToSpeech(
          respuestaNormal,
          nombreFileName,
        );
        return { audioPath: rutaAudio.audioPath, text: rutaAudio.text };
      }

      return { audioPath: '', text: respuestaNormal };
    } catch (error) {
      console.error('Error general responderPregunta:', error);
      return {
        audioPath: '',
        text: '⚠️ Ocurrió un error generando la respuesta.',
      };
    }
  }

  // @Cron('*/5 * * * *') // Cada 5 minuto
  private async generarTriviaMiembros() {
    console.log('Generando trivia...' + new Date().toLocaleString());
    const miembrosHoy = new Date().getDate();
    const miembros = await this.miembrosService.findAll();
    if (!miembros || miembros.miembros.length === 0) return;
    console.log('Miembros encontrados: ', miembros.miembros);
    let i = 0;
    for (const miembro of miembros.miembros) {
      const temaElegido = TriviaTemas.escogerTemaAleatorio('miembro');
      const key = `${miembro.telefono}_${miembrosHoy}`;
      console.log('key: ', this.enviadosHoy);
      if (this.enviadosHoy.has(key)) {
        console.log(
          `⚠️ Ya se envió trivia a ${miembro.name} (${miembro.telefono})`,
        );
        continue;
      }
      if (miembro.telefono === '573024064896') {
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
                '',
              ),
            },
          ];
        }
        const mensaje = `¡Hola, ${miembro.name}! 🙌 Hoy quiero retarte con unas preguntitas bíblicas sobre ${temaElegido.nombre} que te harán pensar.
Descipcion del tema: ${temaElegido.descripcion}      
¿Listo para responder la trivia del día?
📖✨ ¡Vamos a aprender juntos del gran amor de Dios!  `;
        this.historiales[miembro.telefono].push({
          role: 'assistant',
          content: mensaje,
        });

        await this.manejoDeMensajesService.guardarMensaje(
          miembro.telefono,
          mensaje,
          'trivia',
        );
        console.log(
          `✅ Trivia enviada a ${miembro.name} (${miembro.telefono})`,
        );
      }
    }
  }
  async generarTriviaAsistentes() {
    console.log('Generando trivia...' + new Date().toLocaleString());
    const asistentesHoy = new Date().getDate();
    const asistentes = await this.asistenciasService.findAll();
    if (!asistentes || asistentes.length === 0) return;
    console.log('Asistentes encontrados: ', asistentes.length);
    let i = 0;
    for (const asistente of asistentes) {
      const temaElegido = TriviaTemas.escogerTemaAleatorio('asistente');
      const key = `${asistente.telefono}_${asistentesHoy}`;
      console.log('key: ', this.enviadosHoy);
      if (this.enviadosHoy.has(key)) {
        console.log(
          `⚠️ Ya se envió trivia a ${asistente.nombre} (${asistente.telefono})`,
        );
        continue;
      }
      this.enviadosHoy.add(key);
      if (asistente.telefono === '573024064896') {
        console.log('Mensajes enviados: ', (i = ++i));
        // Marca como enviado
        if (!this.historiales[asistente.telefono]) {
          this.historiales[asistente.telefono] = [
            {
              role: 'system',
              content: systemPromptFunction(
                new Date(),
                asistente.telefono,
                'texto',
                '',
              ),
            },
          ];
        }
        const mensaje = `¡Hola, ${asistente.nombre}! 🙌 Hoy quiero retarte con unas preguntitas bíblicas sobre ${temaElegido.nombre} que te harán pensar.
Descipcion del tema: ${temaElegido.descripcion}      
¿Listo para responder la trivia del dia?
📖✨ ¡Vamos a aprender juntos del gran amor de Dios! `;
        this.historiales[asistente.telefono].push({
          role: 'assistant',
          content: mensaje,
        });

        await this.manejoDeMensajesService.guardarMensaje(
          asistente.telefono,
          mensaje,
          'trivia',
        );
        console.log(
          `✅ Trivia enviada a ${asistente.nombre} (${asistente.telefono})`,
        );
      }
    }
  }
}
