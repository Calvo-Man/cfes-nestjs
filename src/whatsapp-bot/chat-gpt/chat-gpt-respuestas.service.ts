import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import systemPromptFunction from './system-prompt';
import { ModerationService } from './services/moderation.service';
import { ControlToolService } from './services/ControlTool.service';
import { loadMcpTools } from 'src/mcp';
import { ControllerToolService } from './controllers/mcp.controller';
import { HistorialMensajesService } from './services/HistorialMensajes.service';
import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
@Injectable()
export class ChatGptMcpRespuestasService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private toolsMcp: any[];
  private logger = new Logger(ChatGptMcpRespuestasService.name);

  constructor(
    private readonly moderationService: ModerationService,
    private readonly controllerToolService: ControllerToolService,
    private readonly controlToolService: ControlToolService,
    private readonly historialService: HistorialMensajesService,
  ) {
    this.toolsMcp = loadMcpTools({
      peticionesService: this.controllerToolService.getPeticionesService(),
      teologiaService: this.controllerToolService.getTeologiaService(),
      aseosService: this.controllerToolService.getAseoService(),
      asistenciasService: this.controllerToolService.getAsistenciasService(),
      casasDeFeService: this.controllerToolService.getCasasDeFeService(),
      eventosService: this.controllerToolService.getEventosService(),
      mensajesService: this.controllerToolService.getManejoDeMensajesService(),
      miembrosService: this.controllerToolService.getMiembrosService(),
      historialMensajesService:
        this.controllerToolService.getHistorialMensajesService(),
    });
  }

  /**
   * Convierte historial en formato válido para OpenAI
   */
  private historialToMessages(
    historial: any[],
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    let toolCallMap: Record<string, boolean> = {};

    for (const m of historial) {
      if (m.rol === 'assistant' && m.toolCalls?.length) {
        messages.push({
          role: 'assistant',
          content: m.contenido ?? null,
          tool_calls: m.toolCalls.map((t) => ({
            id: t.id,
            type: 'function',
            function: { name: t.name, arguments: t.arguments },
          })),
        });
        toolCallMap = Object.fromEntries(m.toolCalls.map((t) => [t.id, true]));
      } else if (m.rol === 'tool') {
        if (m.toolCallId && toolCallMap[m.toolCallId]) {
          messages.push({
            role: 'tool',
            content: m.contenido,
            tool_call_id: m.toolCallId,
          });
        }
      } else {
        messages.push({
          role: m.rol as 'system' | 'user' | 'assistant',
          content: m.contenido,
        });
      }
    }
    return messages;
  }

  async responderPregunta(mensaje: string, telefono: string): Promise<any> {
    try {
      const moderacion = await this.moderationService.verificarMensaje(
        telefono,
        mensaje,
      );

      // Fuerza actualización por cambios de moderación
      await this.syncSystemPrompt(telefono, moderacion);

      await this.historialService.agregarMensaje(telefono, 'user', mensaje);
      let historial = await this.historialService.obtenerHistorial(telefono);
      const messages = this.historialToMessages(historial);
      if (messages.length === 0)
        throw new Error(`Historial vacío para ${telefono}`);

      const tools: OpenAI.Chat.ChatCompletionTool[] = this.toolsMcp.map(
        (t) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema,
          },
        }),
      );

      this.logger.log(
        `🔹 Tools disponibles: ${tools
          .map((t) => (t.type === 'function' ? t.function!.name : ''))
          .join(', ')}`,
      );

      const chat = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages,
        tools,
        tool_choice: 'auto',
      });

      const choice = chat.choices[0].message;
      const toolCalls = (choice.tool_calls ?? [])
        .filter(
          (tc): tc is ChatCompletionMessageToolCall & { type: 'function' } =>
            tc.type === 'function',
        )
        .map((tc) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: tc.function.arguments,
        }));

      // Si hay tool calls, ignoramos el content para no mostrar "(to=functions...)"
      const contenidoAssistant =
        toolCalls.length > 0 ? '' : (choice.content ?? '');

      await this.historialService.agregarMensaje(
        telefono,
        'assistant',
        contenidoAssistant,
        undefined,
        toolCalls.map((tc) => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments,
        })),
      );

      if (toolCalls.length > 0) {
        this.logger.log(
          `🔹 Tool calls para ${telefono}: ${toolCalls.map((t) => t.name).join(', ')}`,
        );
        for (const toolCall of toolCalls) {
          let args: any = {};
          try {
            args = JSON.parse(toolCall.arguments);
            this.logger.log(`🔹 Argumentos de tool: ${JSON.stringify(args)}`);
          } catch (error) {
            this.logger.error('❌ Error parseando argumentos', error);
          }

          const tool = this.toolsMcp.find((t) => t.name === toolCall.name);
          let result: any = { text: '⚠️ Tool no encontrada' };

          if (tool) {
            try {
              const res = await tool.execute(args);
              result = { text: JSON.stringify(res) };

              this.logger.log(`🔹 Resultado de tool: ${result.text}`);

              if (toolCall.name === 'cambiar_modo_respuesta') {
                await this.syncSystemPrompt(telefono, moderacion);
              }
              if (toolCall.name === 'eliminar_historial_mensajes') {
                this.logger.log(
                  `🔹 Historial eliminado para ${telefono}, saliendo de tool calls`,
                );
                return {
                  audioPath: '',
                  text: '⚠️ Se ha eliminado el historial de conversaciones.',
                };
              }
            } catch (error) {
              this.logger.error(`❌ Error ejecutando tool`, error);
              result = { text: '❌ Error ejecutando tool' };
            }
          }

          await this.historialService.agregarMensaje(
            telefono,
            'tool',
            result.text,
            toolCall.id,
          );
        }

        const historialConTool =
          await this.historialService.obtenerHistorial(telefono);
        const messagesConTool = this.historialToMessages(historialConTool);

        const segundaRespuesta = await this.openai.chat.completions.create({
          model: 'gpt-5-mini',
          messages: messagesConTool,
        });

        const respuestaFinal =
          segundaRespuesta.choices[0].message.content ?? '';
        await this.historialService.agregarMensaje(
          telefono,
          'assistant',
          respuestaFinal,
        );

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

      // Sin tool calls
      const respuestaNormal = choice.content ?? '';
      await this.historialService.agregarMensaje(
        telefono,
        'assistant',
        respuestaNormal,
      );

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
      this.logger.error('❌ Error en responderPregunta', error);
      return {
        audioPath: '',
        text: '⚠️ Ocurrió un error generando la respuesta.',
      };
    }
  }

  private async syncSystemPrompt(telefono: string, moderacion: any) {
    await this.historialService.actualizarSystemPrompt(
      telefono,
      systemPromptFunction(
        new Date(),
        telefono,
        await this.controlToolService.obtenerModoRespuesta(telefono),
        moderacion,
      ),
    );
    this.logger.log(`🔹 System prompt actualizado para ${telefono}`);
  }
}
