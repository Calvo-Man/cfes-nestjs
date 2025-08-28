// src/mcp/teologia.mcp.ts
import { TeologiaService } from './teologia.service';

export const teologiaMcpTools = (teologiaService: TeologiaService) => [
  {
    name: 'buscar_respuestas_teologicas',
    description:
      'Busca respuestas teológicas para una o varias preguntas usando Qdrant y embeddings de OpenAI',
    inputSchema: {
      type: 'object',
      properties: {
        preguntas: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Lista de preguntas teológicas a consultar (Haz todas las preguntas necesarias para la consulta semántica, entre mas preguntas mejor la respuesta)',
        },
      },
      required: ['preguntas'],
    },
    // 🔹 Implementamos execute en vez de handler
    execute: async (args: any) => {
      if (!args.preguntas || !Array.isArray(args.preguntas)) {
        throw new Error('El parámetro preguntas debe ser un array de strings');
      }
      const respuestas =
        await teologiaService.buscarRespuestasTeologicasMultiple(
          args.preguntas,
        );
      return respuestas;
    },
  },
];
