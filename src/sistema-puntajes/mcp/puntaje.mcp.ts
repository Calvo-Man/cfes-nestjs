// src/mcp/puntajes-ia.mcp.ts
import { PuntajeService } from '../sistema-puntajes.service';

// function getSemanaISO(): string {
//   const date = new Date();
//   // Pasar al jueves de la semana actual para asegurar el año ISO correcto
//   date.setHours(0, 0, 0, 0);
//   date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
//   const week1 = new Date(date.getFullYear(), 0, 4);
//   const weekNumber = Math.round(
//     ((date.getTime() - week1.getTime()) / 86400000 + 1) / 7
//   );
//   return `semana-${weekNumber}`;
// }
function getSemanaISO(): string {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = Math.floor(
    (now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((pastDaysOfYear + oneJan.getDay() + 1) / 7);
  return `semana-${weekNumber}`;
}


export const puntajesIaMcpTools = (puntajeService: PuntajeService) => [
  {
    name: 'registrar_inicio_trivia',
    description:
      'Crea un registro de puntaje cuando un miembro comienza la trivia en curso y retorna el puntaje acumulado en la semana.',
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
      return await puntajeService.registrarInicio(
        args.triviaId,
        args.miembroId,
      );
    },
  },
  {
    name: 'registrar_resultado_trivia',
    description:
      'Registra el puntaje obtenido por un miembro en la trivia de hoy.',
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
          description: 'Puntaje obtenido en la trivia de hoy',
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
          description:
            'Semana a consultar (formato: semana-XX). Si no se envía, se usa la semana actual',
        },
        cantidad: {
          type: 'number',
          description:
            'Cantidad de miembros a retornar en el podio, por defecto 3',
        },
      },
    },
    execute: async (args: any) => {
      const semana = args.semana || getSemanaISO();
      const cantidad = args.cantidad || 3;
      return await puntajeService.obtenerPodio(semana, cantidad);
    },
  },
  {
    name: 'obtener_puntaje_miembro',
    description: 'Obtiene el puntaje semanal de un miembro específico.',
    inputSchema: {
      type: 'object',
      properties: {
        miembroId: {
          type: 'number',
          description: 'ID del miembro',
        },
        semana: {
          type: 'string',
          description:
            'Semana a consultar (formato: semana-XX). Si no se envía, se usa la semana actual',
        },
      },
      required: ['miembroId'],
    },
    execute: async (args: any) => {
      const semana =args.semana || getSemanaISO();
      return await puntajeService.obtenerPuntajesPorMiembro(
        args.miembroId,
        semana,
      );
    },
  },
  {
    name: 'obtener_detalle_puntaje_miembro',
    description:
      'Obtiene el puntaje de cada trivia de un miembro especifico.',
    inputSchema: {
      type: 'object',
      properties: {
        miembroId: {
          type: 'number',
          description: 'ID del miembro',
        },
        semana: {
          type: 'string',
          description:
            'Semana a consultar (formato: semana-XX). Si no se envía, se usa la semana actual',
        },
      },
      required: ['miembroId'],
    },
    execute: async (args: any) => {
      const semana = args.semana || getSemanaISO();
      return await puntajeService.obtenerPuntajeDetalle(args.miembroId, semana);
    },
  },
];
