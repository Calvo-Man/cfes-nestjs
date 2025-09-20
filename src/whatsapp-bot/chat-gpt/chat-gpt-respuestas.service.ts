import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { encoding_for_model } from '@dqbd/tiktoken';
import systemPromptFunction from './system-prompt';
import { ModerationService } from './services/moderation.service';
import { ControlToolService } from './services/ControlTool.service';
import { loadMcpTools } from 'src/mcp';
import { ControllerToolService } from './controllers/mcp.controller';
import { HistorialMensajesService } from './services/HistorialMensajes.service';
import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';

const MAX_TOKENS_CHUNK = 400; // 🔑 tamaño del bloque en tokens
const MODEL = 'gpt-5-mini';

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
      puntajeService: this.controllerToolService.getPuntajeService(),
      triviaService: this.controllerToolService.getTriviaService(),
    });
  }

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

  /**
   * Envía respuesta final en streaming,
   * cortando cada bloque según tokens.
   */
  async responderPregunta(
    mensaje: string,
    telefono: string,
    onPartial?: (chunk: string) => Promise<void>, // callback de bloques
  ): Promise<any> {
    try {
      const moderacion = await this.moderationService.verificarMensaje(
        telefono,
        mensaje,
      );

      await this.syncSystemPrompt(telefono, moderacion);
      await this.historialService.agregarMensaje(telefono, 'user', mensaje);

      let historial =
        await this.historialService.obtenerHistorialActivo(telefono);
      let messages = this.historialToMessages(historial);

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

      let audioPath = '';

      // 🔁 Bucle hasta que no haya tool calls
      while (true) {
        const chat = await this.openai.chat.completions.create({
          model: MODEL,
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

        if (toolCalls.length === 0) {
          // ✅ Inicia stream final
          this.logger.log(`✅ ${telefono} - Streaming tokenizado`);
          const stream = await this.openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages,
            stream: true,
          });
          const encoder = encoding_for_model('gpt-4.1-mini');
          let buffer = '';
          let respuestaFinal = '';
          let tokenCount = 0;
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              buffer += delta;
              respuestaFinal += delta;

              const tokens = encoder.encode(buffer);
              tokenCount += encoder.encode(delta).length;
              if (tokens.length >= MAX_TOKENS_CHUNK) {
                // Buscar el último punto, signo de exclamación o interrogación
                const ultimoPunto = Math.max(
                  buffer.lastIndexOf('.'),
                  buffer.lastIndexOf('!'),
                  buffer.lastIndexOf('?'),
                );

                let enviar = buffer;

                if (ultimoPunto !== -1) {
                  // Enviar hasta el último signo de puntuación
                  enviar = buffer.slice(0, ultimoPunto + 1);
                  buffer = buffer.slice(ultimoPunto + 1); // Guardar el resto
                } else {
                  // Si no hay punto, enviamos todo para no bloquear el stream
                  buffer = '';
                }

                if (onPartial) await onPartial(enviar);
                tokenCount = encoder.encode(buffer).length; // reinicia contando lo que queda
              }
            }
          }

          // enviar cualquier resto que quede
          if (buffer.trim()) {
            if (onPartial) await onPartial(buffer);
          }

          encoder.free();

          this.logger.log(`✅ ${telefono} - Streaming finalizado`);

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
            audioPath = rutaAudio.audioPath;
            return { audioPath, text: rutaAudio.text };
          }

          return { audioPath: '', text: respuestaFinal };
        }

        // Guardar mensaje con tool_calls
        await this.historialService.agregarMensaje(
          telefono,
          'assistant',
          choice.content ?? '',
          undefined,
          toolCalls.map((tc) => ({
            id: tc.id,
            name: tc.name,
            arguments: tc.arguments,
          })),
        );

        // Ejecutar cada tool
        for (const toolCall of toolCalls) {
          let args: any = {};
          this.logger.log(`⚠️ Ejecutando tool ${toolCall.name}`);
          try {
            args = JSON.parse(toolCall.arguments);
          } catch (e) {
            this.logger.error('❌ Error parseando argumentos', e);
          }

          const tool = this.toolsMcp.find((t) => t.name === toolCall.name);
          let result: any = { text: '⚠️ Tool no encontrada' };

          if (tool) {
            try {
              const res = await tool.execute(args);
              result = { text: JSON.stringify(res) };

              if (toolCall.name === 'cambiar_modo_respuesta') {
                await this.syncSystemPrompt(telefono, moderacion);
              }
              if (toolCall.name === 'eliminar_historial_mensajes') {
                return {
                  audioPath: '',
                  text: '⚠️ Se ha eliminado el historial de conversaciones.',
                };
              }
            } catch (e) {
              result = { text: e.message || '❌ Error ejecutando tool' };
            }
          }

          await this.historialService.agregarMensaje(
            telefono,
            'tool',
            result.text,
            toolCall.id,
          );
        }

        // Recalcular historial después de tools
        historial =
          await this.historialService.obtenerHistorialActivo(telefono);
        messages = this.historialToMessages(historial);
      }
    } catch (error) {
      this.logger.error('❌ Error en responderPregunta', error);
      try {
        await this.historialService.eliminarUltimoToolCall(telefono);
      } catch {
        
      }
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
  }
}
