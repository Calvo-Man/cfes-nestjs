// src/mcp/teologia.mcp.ts
import { HistorialMensajesService } from './HistorialMensajes.service';

export const historialMcpTools = (
  historialMensajesService: HistorialMensajesService,
) => [
  {
    name: 'eliminar_historial_mensajes',
    description:
      'Elimina el historial de conversaciones con la ia de un usuario en la base de datos',
    inputSchema: {
      type: 'object',
      properties: {
        preguntas: {
          type: 'array',
          items: { type: 'string' },
          telefono:
            'Telefono del usuario que deseas eliminar el historial de mensajes (Solo puede ser usado el numero del usuario que esta interactuando con el bot)',
        },
      },
      required: ['telefono'],
    },
    // 🔹 Implementamos execute en vez de handler
    execute: async (args: any) => {
      if (!args.telefono || typeof args.telefono !== 'string') {
        throw new Error('El parámetro telefono debe ser un string válido');
      }
      return await historialMensajesService.eliminarHistorial(args.telefono);
    },
  },
];
