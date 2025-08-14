// teologia.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai'; // ✅ Importación correcta para v4
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class TeologiaService {
  private QDRANT_URL =
    'https://48808db5-4d15-4428-99f5-daee11219297.us-east4-0.gcp.cloud.qdrant.io';
  private QDRANT_API_KEY = process.env.QDRANT_API_KEY;
  private COLLECTION = 'preguntas_teologicas';

  private openai: OpenAI; // ✅ Declarar propiedad de clase

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async crearEmbedding(texto: string): Promise<any> {
    try {
      const response = await this.openai.embeddings.create({
        input: texto,
        model: 'text-embedding-3-small',
      });
      // ✅ Retorna el vector de embedding
      return response.data[0].embedding;
    } catch (error) {
      console.warn('⚠️ OpenAI Embedding falló. Usando embedding simulado.');
      return 'No se pudo crear el embedding';
    }
  }

  async agregarPregunta(pregunta: string, respuesta: string, fuente: string) {
    // Limpieza segura
    const preguntaLimpia = this.limpiarTexto(pregunta);
    const respuestaLimpia = this.limpiarTexto(respuesta);
    const vector = await this.crearEmbedding(preguntaLimpia);
    const id = uuidv4();
    try {
      const response = await axios.put(
        `${this.QDRANT_URL}/collections/${this.COLLECTION}/points`,
        {
          points: [
            {
              id,
              vector,
              payload: {
                preguntaLimpia,
                respuestaLimpia,
                fuente,
              },
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.QDRANT_API_KEY,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error al agregar la pregunta:', error);
      throw error;
    }
  }
  limpiarTexto(texto: string): string {
    return texto
      .replace(/\r?\n|\r/g, '\n') // Normaliza saltos de línea
      .replace(/\s{2,}/g, ' ') // Reduce espacios dobles o más
      .replace(/"/g, '\\"') // Escapa comillas dobles
      .trim(); // Quita espacios extremos
  }
async buscarRespuestasTeologicasMultiple(
  preguntas: string[],
): Promise<Record<string, string>> {
  const promesas = preguntas.map(async (pregunta) => {
    const vector = await this.crearEmbedding(pregunta);

    const { data } = await axios.post(
      `${this.QDRANT_URL}/collections/${this.COLLECTION}/points/search`,
      {
        vector,
        limit: 3,
        with_payload: true,
        score_threshold: 0.75,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.QDRANT_API_KEY,
        },
      },
    );

    const resultados = (data.result || [])
      .filter((r: any) => r.payload?.respuesta)
      .sort((a: any, b: any) => b.score - a.score);

    if (resultados.length === 0) {
      return [
        pregunta,
        '❌ No encontré una respuesta teológica relevante.',
      ] as const;
    }

    const { listaFormateada } = resultados.reduce(
      (acc: any, r: any) => {
        if (!acc.vistos.has(r.payload.respuesta)) {
          acc.vistos.add(r.payload.respuesta);
          acc.listaFormateada.push(
            `🔹 *Relevancia:* ${(r.score * 100).toFixed(2)}%\n${r.payload.respuesta}\n${r.payload.fuente}`
          );
        }
        return acc;
      },
      { vistos: new Set<string>(), listaFormateada: [] as string[] }
    );

    return [pregunta, listaFormateada.join('\n\n')] as const;
  });

  const resultadosArray = await Promise.all(promesas);
  return Object.fromEntries(resultadosArray);
}
}
