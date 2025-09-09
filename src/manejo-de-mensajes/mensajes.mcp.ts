// src/mcp/mensajes-ia.mcp.ts

import { ManejoDeMensajesService } from "./manejo-de-mensajes.service";

export const mensajesIaMcpTools = (mensajesService: ManejoDeMensajesService) => [
  {
    name: 'guardar_mensaje_ia',
    description: 'Guarda un mensaje enviado desde un miembro específico usando IA para posteriormente enviarlo al destinatario (Disponible solo para miembros registrados)',
    inputSchema: {
      type: 'object',
      properties: {
        telefonoFrom: { type: 'string', description: 'Teléfono del miembro que quiere envíar el mensaje' },
        telefono: { type: 'string', description: 'Teléfono del destinatario' },
        contenido: { type: 'string', description: 'Contenido del mensaje que será enviado (Pregunta al miembro si quiere uncluir su nombre en el mensaje)' },
        enviar_por: { type: 'string', description: 'Indica quién envía el mensaje, ej: "sistema", "miembro", "lider", "pastor","IA" (Esto lo hace la IA, no lo preguntes)' },
      },
      required: ['telefonoFrom', 'telefono', 'contenido', 'enviar_por'],
    },
    execute: async (args: any) => {
      return await mensajesService.guardarMensajeIA(
        args.telefonoFrom,
        args.telefono,
        args.contenido,
        args.enviar_por,
      );
    },
  },
  {
    name: 'guardar_varios_mensajes_ia',
    description: 'Envía un mensaje a varias categorías desde un miembro específico usando IA',
    inputSchema: {
      type: 'object',
      properties: {
        telefonoFrom: { type: 'string', description: 'Teléfono del miembro que envía el mensaje (No lo preguntes, usa el que ya conoces)' },
        contenido: { type: 'string', description: 'Contenido del mensaje (Si el usuario no lo da, Se pregunta si quiere una redacción para el contenido)' },
        enviado_a: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de categorías: ["miembros","pastores","lideres","servidores","administradores","asistentes","jovenes","mujeres","hombres"](Solo estas categorías son validas)',
        },
      },
      required: ['telefonoFrom', 'contenido', 'enviado_a'],
    },
    execute: async (args: any) => {
      return await mensajesService.guardarVariosMensajesIA(
        { contenido: args.contenido, enviado_a: args.enviado_a },
        args.telefonoFrom,
      );
    },
  },
];
