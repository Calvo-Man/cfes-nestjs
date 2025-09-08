// src/mcp/puntajes-ia.mcp.ts

import { PuntajeService } from "../sistema-puntajes.service";

export const puntajesIaMcpTools = (puntajeService: PuntajeService) => [
  {
    name: 'registrar_inicio_trivia',
    description:
      'Crea un registro de puntaje cuando un miembro comienza la trivia en curso y retorna el puntaje actual del miembro.',
    inputSchema: {
      type: 'object',
      properties: {
        triviaId: {
          type: 'number',
          description: 'ID de la trivia que se está comenzando',
        },
        miembroId: {
          type: 'number',
          description: 'ID del miembro que comienza la trivia',
        },
      },
      required: ['triviaId', 'miembroId'],
    },
    execute: async (args: any) => {
      return await puntajeService.registrarInicio(args.triviaId, args.miembroId);
    },
  },
  {
    name: 'registrar_resultado_trivia',
    description:
      'Registra el resultado final de un miembro en una trivia, incluyendo puntos, aciertos y errores.',
    inputSchema: {
      type: 'object',
      properties: {
        triviaId: {
          type: 'number',
          description: 'ID de la trivia que se jugó',
        },
        miembroId: {
          type: 'number',
          description: 'ID del miembro que jugó',
        },
        puntos: {
          type: 'number',
          description: 'Puntaje total obtenido en la trivia',
        },
        correctas: {
          type: 'number',
          description: 'Número de respuestas correctas',
        },
        incorrectas: {
          type: 'number',
          description: 'Número de respuestas incorrectas',
        },
      },
      required: ['triviaId', 'miembroId', 'puntos', 'correctas', 'incorrectas'],
    },
    execute: async (args: any) => {
      return await puntajeService.registrarResultado(
        args.triviaId,
        args.miembroId,
        args.puntos,
        args.correctas,
        args.incorrectas,
      );
    },
  },
  {
    name: 'obtener_podio_semanal',
    description: 'Obtiene el podio de puntajes de la semana.',
    inputSchema: {
      type: 'object',
      properties: {
        semana: {
          type: 'string',
          description: 'Semana de la trivia, ej: "semana-36" (semana actual del año)',
        },
        cantidad: {
          type: 'number',
          description: 'Cantidad de miembros a retornar en el podio, por defecto 3',
        },
      },
      required: ['semana'],
    },
    execute: async (args: any) => {
      return await puntajeService.obtenerPodio(args.semana,args.cantidad || 3);
    },
  },
];
