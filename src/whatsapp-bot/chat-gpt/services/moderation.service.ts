import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bloqueo } from 'src/whatsapp-bot/chat-gpt/entities/bloqueos.entity';


@Injectable()
export class ModerationService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(
    @InjectRepository(Bloqueo)
    private bloqueoRepo: Repository<Bloqueo>,
  ) {}

  async verificarMensaje(telefono: string, mensaje: string) {
    // 1. Llamada a la API de Moderation
    const response = await this.openai.moderations.create({
      model: 'omni-moderation-latest',
      input: mensaje,
    });

    const result = response.results[0];

    // 2. Verificar si es ofensivo
    if (!result.flagged) {
      return false; // flujo normal
    }

    // Clasificamos leve o grave según categorías detectadas
    const categorias = result.categories;
    let esGrave = false;

    if (
      categorias['violence'] ||
      categorias['hate'] ||
      categorias['harassment/threatening']
    ) {
      esGrave = true;
    }

    // 3. Manejo en BD
    let bloqueo = await this.bloqueoRepo.findOne({ where: { telefono } });

    if (!bloqueo) {
      bloqueo = this.bloqueoRepo.create({ telefono });
    }

    if (esGrave) {
      bloqueo.ofensasGraves += 1;

      if (bloqueo.ofensasGraves >= 3) {
        // Aquí el agente IA decide el tiempo de baneo
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

    await this.bloqueoRepo.save(bloqueo);

    const mensajeOfensivo = esGrave ? `Indicale al usuario que su mensaje fue ofensivo y que puede ser motivo de bloqueo por 3 ofensas graves.` : `Indicale al usuario que su mensaje fue ofensivo, pero no lo bloquearemos. puedes pedir explicaciones del motivo del mensaje ofensivo.`; 
    return mensajeOfensivo;
  }

  // Esta función puede delegar al agente IA la decisión
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

Debes decidir el tiempo de bloqueo según la cantidad de ofensas, contexto del mensaje y las categorías.:

Responde estrictamente en JSON con este formato:
{
  "dias": número de días de bloqueo,
  "motivo": "texto explicando el motivo del bloqueo"
}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini', // puedes usar gpt-4o-mini o gpt-5-mini
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
