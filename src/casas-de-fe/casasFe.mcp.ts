// src/mcp/casas-de-fe.mcp.ts
import { CasasDeFeService } from '../casas-de-fe/casas-de-fe.service';

export const casasDeFeMcpTools = (casasService: CasasDeFeService) => [
  {
    name: 'listar_casas_de_fe',
    description: 'Obtiene todas las casas de fe con sus datos',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      return await casasService.findAll();
    },
  },
  {
    name: 'obtener_casa_de_fe',
    description: 'Obtiene una casa de fe por ID',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'number' } },
      required: ['id'],
    },
    execute: async (args: any) => {
      if (!args.id) throw new Error('El id es obligatorio');
      return await casasService.findOne(args.id);
    },
  },
  {
    name: 'listar_casas_por_usuario',
    description: 'Obtiene las casas de fe en las que un usuario es encargado',
    inputSchema: {
      type: 'object',
      properties: {
        user: { type: 'string', description: 'Usuario del miembro' },
      },
      required: ['user'],
    },
    execute: async (args: any) => {
      if (!args.user) throw new Error('El user es obligatorio');
      return await casasService.findAllByUser(args.user);
    },
  },
  {
    name: 'obtener_punto_mas_cercano',
    description: 'Busca la casa de fe más cercana a unas coordenadas',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lon: { type: 'number' },
      },
      required: ['lat', 'lon'],
    },
    execute: async (args: any) => {
      return await casasService.obtenerPuntoMasCercano(args.lat, args.lon);
    },
  },
  {
    name: 'buscar_punto_mas_cercano_por_barrio',
    description: 'Busca la casa de fe más cercana a un barrio',
    inputSchema: {
      type: 'object',
      properties: { barrio: { type: 'string' } },
      required: ['barrio'],
    },
    execute: async (args: any) => {
      return await casasService.buscarPuntoMasCercanoDesdeBarrio(args.barrio);
    },
  },
  {
    name: 'punto_mas_cercano_desde_direccion',
    description: 'Busca la casa de fe más cercana a una dirección usando rutas reales',
    inputSchema: {
      type: 'object',
      properties: { direccion: { type: 'string' } },
      required: ['direccion'],
    },
    execute: async (args: any) => {
      return await casasService.puntoMasCercanoDesde(args.direccion);
    },
  },
  

 

  {
    name: 'contar_casas_de_fe',
    description: 'Cuenta cuántas casas de fe existen registradas',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      return await casasService.countCasasDeFe();
    },
  },
];
