import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import systemPromptFunction from './system-prompt';
import { ModerationService } from './services/moderation.service';
import { ControlToolService } from './services/ControlTool.service';
import { loadMcpTools } from 'src/mcp'; // ⬅️ Cargar MCP Tools
import { ControllerToolService } from './controllers/mcp.controller';

@Injectable()
export class ChatGptMcpRespuestasService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private historiales: Record<
    string,
    OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  > = {};
  private toolsMcp: any[];

  constructor(
   
    private readonly moderationService: ModerationService,
    private readonly controllerToolService: ControllerToolService,
    private readonly controlToolService: ControlToolService,
  ) {
    // 🔹 Inicializamos MCP Tools pasando los services necesarios
    this.toolsMcp = loadMcpTools({
      peticionesService: this.controllerToolService.getPeticionesService(),
      teologiaService: this.controllerToolService.getTeologiaService(),
      aseosService: this.controllerToolService.getAseoService(),
      asistenciasService: this.controllerToolService.getAsistenciasService(),
      casasDeFeService: this.controllerToolService.getCasasDeFeService(),
      eventosService: this.controllerToolService.getEventosService(),
      mensajesService: this.controllerToolService.getManejoDeMensajesService(),
      miembrosService: this.controllerToolService.getMiembrosService(),
    });
  }

  async responderPregunta(mensaje: string, telefono: string): Promise<any> {
    try {
      // Inicializar historial si no existe
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
      console.log(this.historiales[telefono]);

      // Moderación del mensaje
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

      // Agregar mensaje del usuario
      this.historiales[telefono].push({ role: 'user', content: mensaje });

      // Mantener historial corto
      if (this.historiales[telefono].length > 45) {
        const systemPrompt = this.historiales[telefono][0];
        const resto = this.historiales[telefono].slice(-20);
        this.historiales[telefono] = [systemPrompt, ...resto];
      }

      // 🔹 Enviar solo los schemas de MCP Tools al modelo

      //     toolsSchemas as unknown as OpenAI.Chat.ChatCompletionTool[];
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

      // Primera llamada al modelo
      const chat = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: this.historiales[telefono],
        tools,
        tool_choice: 'auto',
      });

      const choice = chat.choices[0].message;
      const toolCalls = choice.tool_calls ?? [];
      this.historiales[telefono].push(choice);

      // 🔹 Si el modelo pidió usar tools
      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          let args: any = {};
          try {
            args = JSON.parse(toolCall.function.arguments);
            console.log('📖 Arguments:', args);
          } catch (error) {
            console.error('❌ Error parseando toolCall.arguments:', error);
          }

          const tool = this.toolsMcp.find(
            (t) => t.name === toolCall.function.name,
          );
          console.log('📖 Tool:', tool);
          let result: any = { text: '⚠️ Tool no encontrada' };

          if (tool) {
            try {
              const res = await tool.execute(args);
              result = { text: JSON.stringify(res) };
            } catch (error) {
              console.error(
                '❌ Error ejecutando tool:',
                toolCall.function.name,
                error,
              );
              result = {
                text: '❌ Error ejecutando tool: ' + error.response.message
              };
            }
          }
          console.log('📖 Result:', result);
          // 🔹 Agregar resultado como mensaje "tool"
          this.historiales[telefono].push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result.text,
          });
        }

        // Segunda llamada después de ejecutar tools
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

        // 🔊 Si está en modo voz
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

      // 🔹 Si no hubo tool calls
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
      console.error('❌ Error general responderPregunta:', error);
      return {
        audioPath: '',
        text: '⚠️ Ocurrió un error generando la respuesta.',
      };
    }
  }
}
