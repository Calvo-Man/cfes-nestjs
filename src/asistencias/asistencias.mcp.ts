// src/mcp/asistencias.mcp.ts
import { AsistenciasService } from '../asistencias/asistencias.service';

export const asistenciasMcpTools = (asistenciasService: AsistenciasService) => [
  {
    name: 'obtener_asistencias_recurrentes',
    description: 'Obtiene todas las asistencias recurrentes',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      return await asistenciasService.findRecurrentes();
    },
  },
  {
    name: 'obtener_asistencias_no_recurrentes',
    description: 'Obtiene todas las asistencias no recurrentes',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      return await asistenciasService.findNoRecurrentes();
    },
  },
  {
    name: 'obtener_asistencia_por_id',
    description: 'Obtiene una asistencia por ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
      required: ['id'],
    },
    execute: async (args: any) => {
      return await asistenciasService.findOneById(args.id);
    },
  },
  {
    name: 'contar_asistencias',
    description: 'Cuenta todas las asistencias registradas',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      return await asistenciasService.countAsistencias();
    },
  },
  {
    name: 'contar_asistencias_mes',
    description: 'Cuenta las asistencias del mes actual',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      return await asistenciasService.countAsistenciasThisMonth();
    },
  },
  {
    name: 'contar_asistencias_por_meses',
    description: 'Cuenta las asistencias de los últimos N meses',
    inputSchema: {
      type: 'object',
      properties: {
        ultimosMeses: { type: 'number', default: 12 },
      },
    },
    execute: async (args: any) => {
      return await asistenciasService.countAsistenciasPorMeses(
        args.ultimosMeses ?? 12,
      );
    },
  },
  //   {
  //     name: 'marcar_recurrente',
  //     description: 'Marca o desmarca una asistencia como recurrente',
  //     inputSchema: {
  //       type: 'object',
  //       properties: {
  //         id: { type: 'number', description: 'ID de la asistencia' },
  //       },
  //       required: ['id'],
  //     },
  //     execute: async (args: any) => {
  //       if (!args.id) throw new Error('El id es obligatorio');
  //       return await asistenciasService.setRecurrente(args.id);
  //     },
  //   },
  //   {
  //     name: 'asignar_casa_de_fe',
  //     description: 'Asigna una asistencia a una casa de fe',
  //     inputSchema: {
  //       type: 'object',
  //       properties: {
  //         id: { type: 'number' },
  //         casaDeFeId: { type: 'number' },
  //       },
  //       required: ['id', 'casaDeFeId'],
  //     },
  //     execute: async (args: any) => {
  //       if (!args.id || !args.casaDeFeId) throw new Error('id y casaDeFeId son obligatorios');
  //       // Se asume que el controlador o servicio externo obtiene la entidad CasaDeFe
  //       return await asistenciasService.asignarCasaDeFe(args.id, args.casaDeFe);
  //     },
  //   },
];
