import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bloqueo } from 'src/whatsapp-bot/chat-gpt/entities/bloqueos.entity';

@Injectable()
export class ModerationService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private logger = new Logger(ModerationService.name);

  constructor(
    @InjectRepository(Bloqueo)
    private bloqueoRepo: Repository<Bloqueo>,
  ) {}

  async verificarMensaje(telefono: string, mensaje: string) {
    // 1️⃣ Llamada a la API de moderación
    const response = await this.openai.moderations.create({
      model: 'omni-moderation-latest',
      input: mensaje,
    });

    const result = response.results[0];

    // 2️⃣ Verificar si es ofensivo
    if (!result.flagged) return false; // mensaje seguro

    // 3️⃣ Clasificación leve o grave
    const categorias = result.categories;
    const esGrave =
      categorias['violence'] ||
      categorias['hate'] ||
      categorias['harassment/threatening'];

    // 4️⃣ Obtener o crear registro de bloqueo
    let bloqueo = await this.bloqueoRepo.findOne({ where: { telefono } });
    if (!bloqueo) {
      bloqueo = this.bloqueoRepo.create({
        telefono,
        ofensasGraves: 0, // inicializamos en 0
      });
    }

    // 5️⃣ Incrementar ofensas graves de forma segura
    if (esGrave) {
      bloqueo.ofensasGraves = (bloqueo.ofensasGraves ?? 0) + 1;

      // 6️⃣ Verificar si alcanza límite de bloqueos
      if (bloqueo.ofensasGraves >= 3) {
        const tiempo = await this.decidirTiempoDeBaneo(
          mensaje,
          bloqueo.ofensasGraves,
          categorias,
        );
        bloqueo.bloqueadoHasta = tiempo.fechaFin;
        bloqueo.motivoBloqueo = tiempo.motivo;

        await this.bloqueoRepo.save(bloqueo);

        return `
        Has sido bloqueado por ${tiempo.dias} días.
        Motivo: ${tiempo.motivo}.
        El bloqueo se levantará el ${tiempo.fechaFin.toLocaleDateString()}.
        `;
      }
    }

    // 7️⃣ Guardar cambios en BD (aunque sea leve)
    await this.bloqueoRepo.save(bloqueo);

    // 8️⃣ Mensaje informativo al usuario
    const mensajeOfensivo = esGrave
      ? `Tu mensaje fue ofensivo y puede ser motivo de bloqueo si acumulas 3 ofensas graves.`
      : `Tu mensaje fue ofensivo, pero no alcanza para bloqueo. Puedes explicar tu motivo.`;

    return mensajeOfensivo;
  }

  // Función que delega al agente IA la decisión del tiempo de baneo
  private async decidirTiempoDeBaneo(
    mensaje: string,
    cantidad: number,
    categorias: any,
  ): Promise<{ fechaFin: Date; motivo: string; dias: number }> {
    const prompt = `
Eres un moderador de un chat de iglesia. 
El usuario ha acumulado ${cantidad} ofensas graves. 
El último mensaje fue: "${mensaje}"
Las categorías detectadas fueron: ${JSON.stringify(categorias)}.

Debes decidir el tiempo de bloqueo según la cantidad de ofensas, contexto del mensaje y las categorías.

Responde estrictamente en JSON con este formato:
{
  "dias": número de días de bloqueo,
  "motivo": "texto explicando el motivo del bloqueo"
}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini', // puedes usar gpt-5-mini si quieres
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }, // obliga a JSON
    });

    const respuesta = JSON.parse(completion.choices[0].message.content || '{}');

    const dias = respuesta.dias ?? 3;
    const motivo =
      respuesta.motivo ?? `Ofensas graves acumuladas (${cantidad}).`;

    return {
      fechaFin: new Date(Date.now() + dias * 24 * 60 * 60 * 1000),
      motivo,
      dias,
    };
  }
}
