// src/mcp/aseos.mcp.ts
import { AseosService } from '../aseos/aseos.service';

export const aseosMcpTools = (aseosService: AseosService) => [
  {
    name: 'buscar_asignaciones_aseo',
    description: 'Obtiene los aseos asignados a un miembro en el mes actual o siguiente',
    inputSchema: {
      type: 'object',
      properties: {
        miembroId: { type: 'number', description: 'ID del miembro' },
        mes: { 
          type: 'string', 
          enum: ['actual', 'siguiente'],
          default: 'actual',
          description: 'Mes para consultar las asignaciones' 
        },
      },
      required: ['miembroId'],
    },
    execute: async (args: any) => {
      if (!args.miembroId) {
        throw new Error('El parámetro miembroId es obligatorio');
      }

      if (args.mes === 'siguiente') {
        return await aseosService.findAsignedAseosNextMonthById(args.miembroId);
      } else {
        return await aseosService.findAsignedAseosCurrentMonthById(args.miembroId);
      }
    },
  },
  {
    name: 'buscar_encargados_por_fechas',
    description: 'Obtiene los encargados de aseo según una lista de fechas',
    inputSchema: {
      type: 'object',
      properties: {
        fechas: {
          type: 'array',
          items: { type: 'string', format: 'date' },
          description: 'Lista de fechas en formato YYYY-MM-DD',
        },
      },
      required: ['fechas'],
    },
    execute: async (args: any) => {
      if (!args.fechas || !Array.isArray(args.fechas)) {
        throw new Error('El parámetro fechas debe ser un array de strings');
      }
      return await aseosService.buscarEncargadosdeAseoPorFechas(args.fechas);
    },
  },
 
];
