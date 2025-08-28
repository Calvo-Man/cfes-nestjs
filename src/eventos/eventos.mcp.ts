// src/mcp/eventos.mcp.ts
import { EventosService } from '../eventos/eventos.service';

export const eventosMcpTools = (eventosService: EventosService) => [
  //   {
  //     name: 'crear_evento',
  //     description: 'Crea un nuevo evento con los datos proporcionados',
  //     inputSchema: {
  //       type: 'object',
  //       properties: {
  //         name: { type: 'string' },
  //         date: { type: 'string', description: 'Fecha del evento en formato ISO' },
  //         descripcion: { type: 'string' },
  //         lugar: { type: 'string' },
  //       },
  //       required: ['name', 'date'],
  //     },
  //     execute: async (args: any) => {
  //       return await eventosService.create(args);
  //     },
  //   },

  {
    name: 'listar_eventos_por_mes',
    description: 'Obtiene los eventos,reuniones,actividades agrupados por mes',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      return await eventosService.findAllAgrupadoPorMes();
    },
  },
  {
    name: 'listar_eventos_mes_especifico',
    description:
      'Obtiene los eventos, reuniones y actividades de un mes y año específico',
    inputSchema: {
      type: 'object',
      properties: {
        month: { type: 'number', description: 'Número del mes (1-12)' },
        year: { type: 'number', description: 'Año en formato YYYY' },
      },
      required: ['month', 'year'],
    },
    execute: async ({ month, year }) => {
      return await eventosService.findEventosByMonth(month, year);
    },
  },

  {
    name: 'contar_eventos',
    description: 'Cuenta todos los eventos registrados',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      return await eventosService.countEventos();
    },
  },
  {
    name: 'contar_eventos_mes_actual',
    description: 'Cuenta los eventos que hay en el mes actual',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      return await eventosService.countEventosThisMonth();
    },
  },
  //   {
  //     name: 'actualizar_evento',
  //     description: 'Actualiza los datos de un evento por su ID',
  //     inputSchema: {
  //       type: 'object',
  //       properties: {
  //         id: { type: 'number' },
  //         name: { type: 'string' },
  //         date: { type: 'string' },
  //         descripcion: { type: 'string' },
  //         lugar: { type: 'string' },
  //       },
  //       required: ['id'],
  //     },
  //     execute: async (args: any) => {
  //       return await eventosService.update(args.id, args);
  //     },
  //   },
];
