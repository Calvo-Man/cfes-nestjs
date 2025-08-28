// src/mcp/miembros-ia.mcp.ts
import { MiembrosService } from '../miembros/miembros.service';
import { Horario } from '../miembros/enum/horario.enum';

export const miembrosIaMcpTools = (miembrosService: MiembrosService) => [
  {
    name: 'actualizar_horario_aseo_ia',
    description: 'Actualiza el horario de aseo de un miembro por su ID usando IA',
    inputSchema: {
      type: 'object',
      properties: {
        telefono: { type: 'string', description: 'Teléfono del miembro que envía el mensaje' },
        horario_aseo: { type: 'string', enum: Object.values(Horario), description: 'Nuevo horario de aseo' },
      },
      required: ['telefono', 'horario_aseo'],
    },
    execute: async (args: any) => {
      return await miembrosService.updateHorarioAseoIATelefono(args.telefono, args.horario_aseo);
    },
  },
  {
    name: 'cambiar_modo_respuesta',
    description: 'Cambia el modo de respuesta de un miembro (texto/voz) por teléfono',
    inputSchema: {
      type: 'object',
      properties: {
        telefono: { type: 'string', description: 'Número de teléfono del miembro' },
        modo: { type: 'string', description: 'Nuevo modo de respuesta (Seleccione uno: texto, voz)' },
      },
      required: ['telefono', 'modo'],
    },
    execute: async (args: any) => {
      return await miembrosService.cambiarModoRespuesta(args.telefono, args.modo);
    },
  },
  {
    name: 'obtener_informacion_miembro',
    description: 'Obtiene la información de un miembro usando su teléfono',
    inputSchema: {
      type: 'object',
      properties: {
        telefono: { type: 'string', description: 'Número de teléfono del miembro' },
      },
      required: ['telefono'],
    },
    execute: async (args: any) => {
      return await miembrosService.findOneByTelefono(args.telefono);
    },
  },
  {
    name: 'buscar_miembro_por_usuario',
    description: 'Busca un miembro por su usuario',
    inputSchema: {
      type: 'object',
      properties: {
        user: { type: 'string', description: 'Usuario del miembro' },
      },
      required: ['user'],
    },
    execute: async (args: any) => {
      return await miembrosService.findOneByUser(args.user);
    },
  },
  {
    name: 'listar_miembros_activos',
    description: 'Obtiene todos los miembros activos con disponibilidad para aseo',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      return await miembrosService.findAllMembers();
    },
  },
];
