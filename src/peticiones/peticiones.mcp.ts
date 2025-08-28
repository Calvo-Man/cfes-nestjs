// src/peticiones/peticiones.mcp.ts

import { PeticionesService } from './peticiones.service';

export const peticionesMcpTools = (peticionesService: PeticionesService) => [
  {
    name: 'crear_peticion',
    description: 'Crea una nueva petición de oración en el sistema',
    inputSchema: {
      type: 'object',
      properties: {
        contenido: { type: 'string', description: 'Contenido de la petición' },
        categoria: { type: 'string', description: 'Categoría de la petición (ej: salud, familia, trabajo)' },
        nombre: { type: 'string', description: 'Nombre de la persona que realiza la petición' },
        telefono: { type: 'string', description: 'Número de teléfono asociado a la petición' },
      },
      required: ['contenido', 'categoria', 'nombre', 'telefono'],
    },
    execute: async (args: any) => {
      return await peticionesService.crearPeticion({
        contenido: args.contenido,
        categoria: args.categoria,
        nombre: args.nombre,
        telefono: args.telefono,
        redaccion: args.redaccion,
        estado: 'pendiente',
      });
    },
  },
  {
    name: 'listar_peticiones',
    description: 'Lista todas las peticiones registradas',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      return await peticionesService.obtenerTodas();
    },
  },
  {
    name: 'contar_peticiones_por_meseses',
    description: 'Cuenta las peticiones de los últimos N meses',
    inputSchema: {
      type: 'object',
      properties: {
        ultimosMeses: { type: 'number', default: 12 },
      },
    },
    execute: async (args: any) => {
      return await peticionesService.countPeticionesPorMeses(
        args.ultimosMeses ?? 12,
      );
    },
  },
  {
    name: 'obtener_peticion',
    description: 'Obtiene los detalles de una petición específica por su ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la petición' },
      },
      required: ['id'],
    },
    execute: async (args: any) => {
      return await peticionesService.obtenerUna(args.id);
    },
  },
//   {
//     name: 'actualizar_estado_peticion',
//     description: 'Actualiza el estado de una petición (pendiente, atendida, rechazada)',
//     inputSchema: {
//       type: 'object',
//       properties: {
//         id: { type: 'string', description: 'ID de la petición' },
//         estado: { type: 'string', description: 'Nuevo estado de la petición' },
//       },
//       required: ['id', 'estado'],
//     },
//     execute: async (args: any) => {
//       return await peticionesService.marcarEnOracion(args.id, args.estado);
//     },
//   },
];
