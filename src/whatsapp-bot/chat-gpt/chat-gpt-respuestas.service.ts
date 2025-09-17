import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import systemPromptFunction from './system-prompt';
import { ModerationService } from './services/moderation.service';
import { ControlToolService } from './services/ControlTool.service';
import { loadMcpTools } from 'src/mcp';
import { ControllerToolService } from './controllers/mcp.controller';
import { HistorialMensajesService } from './services/HistorialMensajes.service';
import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
import e from 'express';

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

  async responderPregunta(mensaje: string, telefono: string): Promise<any> {
    try {
      const moderacion = await this.moderationService.verificarMensaje(
        telefono,
        mensaje,
      );

      // Actualiza system prompt según moderación
      await this.syncSystemPrompt(telefono, moderacion);

      await this.historialService.agregarMensaje(telefono, 'user', mensaje);

      let historial = await this.historialService.obtenerHistorial(telefono);
      let messages = this.historialToMessages(historial);
      this.logger.log(`🔹 Historial cargado: ${messages}`);
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

      let respuestaFinal = '';
      let audioPath = '';

      // 🔑 Bucle hasta que ya no haya tool calls
      while (true) {
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
        this.logger.log(`🔹 ${toolCalls.length}`);
        if (toolCalls.length === 0) {
          // ✅ Ya no hay tools → respuesta final
          respuestaFinal = choice.content ?? '';
          await this.historialService.agregarMensaje(
            telefono,
            'assistant',
            respuestaFinal,
          );
          this.logger.log(`✅ ${telefono} - Respuesta final generada`);
          // Modo de respuesta: texto o voz
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

        // Guardar el mensaje del assistant que contiene las tool_calls
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
        this.logger.log(
          `🔹 ${telefono} - Tool calls: ${toolCalls
            .map((t) => t.name)
            .join(', ')}`,
        );

        // Ejecutar cada tool y registrar resultado
        for (const toolCall of toolCalls) {
          let args: any = {};
          try {
            args = JSON.parse(toolCall.arguments);
            this.logger.log(
              `🔹 Argumentos de ${toolCall.name}: ${JSON.stringify(args)}`,
            );
          } catch (error) {
            this.logger.error('❌ Error parseando argumentos', error);
          }

          const tool = this.toolsMcp.find((t) => t.name === toolCall.name);
          let result: any = { text: '⚠️ Tool no encontrada' };

          if (tool) {
            try {
              const res = await tool.execute(args);
              result = { text: JSON.stringify(res) };

              this.logger.log(
                `🔹 Resultado de tool ${toolCall.name}: ${result.text}`,
              );

              if (toolCall.name === 'cambiar_modo_respuesta') {
                await this.syncSystemPrompt(telefono, moderacion);
              }
              if (toolCall.name === 'eliminar_historial_mensajes') {
                this.logger.log(
                  `🔹 Historial eliminado para ${telefono}, deteniendo ejecución`,
                );
                return {
                  audioPath: '',
                  text: '⚠️ Se ha eliminado el historial de conversaciones.',
                };
              }
            } catch (error) {
              this.logger.error(`❌ Error ejecutando tool`, error.message);
              result = { text: error.message || '❌ Error ejecutando tool'};
            }
          }

          await this.historialService.agregarMensaje(
            telefono,
            'tool',
            result.text,
            toolCall.id,
          );
        }

        // Actualizar historial con resultados de las tools
        historial = await this.historialService.obtenerHistorial(telefono);
        messages = this.historialToMessages(historial);
      }
    } catch (error) {
      this.logger.error('❌ Error en responderPregunta', error);

      // 🚨 Limpieza de tool_calls incompletos en el historial
      try {
        await this.historialService.eliminarUltimoToolCall(telefono);
        this.logger.warn(
          `🧹 Se eliminó el último tool_call incompleto para ${telefono}`,
        );
      } catch (cleanupError) {
        this.logger.error(
          '⚠️ No se pudo limpiar tool_call incompleto',
          cleanupError,
        );
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
    this.logger.log(`🔹 System prompt actualizado para ${telefono}`);
  }
}
