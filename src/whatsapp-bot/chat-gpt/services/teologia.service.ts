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

  async crearEmbedding(texto: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        input: texto,
        model: 'text-embedding-3-small',
      });
      return response.data[0].embedding;
    } catch (error) {
      console.warn('⚠️ OpenAI Embedding falló. Usando embedding simulado.');
      return Array.from({ length: 1536 }, () => Math.random()); // Embedding de prueba
    }
  }

  async agregarPregunta(pregunta: string, respuesta: string) {
    const vector = await this.crearEmbedding(pregunta);
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
                pregunta,
                respuesta,
                fuente: 'gotquestions.org',
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
  async buscarRespuestasTeologicas(texto: string): Promise<string> {
    const vector = await this.crearEmbedding(texto);

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

    const resultados = data.result || [];

    const respuestas = resultados.map(
      (resultado: any) => resultado.payload.respuesta,
    );

    if (respuestas.length === 0) {
      return '❌ No encontré una respuesta teológica relevante para tu pregunta.';
    }

    return respuestas.join('\n\n'); // 👈 Une respuestas con doble salto de línea
  }
}
