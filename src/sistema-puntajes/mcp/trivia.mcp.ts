// src/mcp/trivias-ia.mcp.ts
import { TriviaService } from 'src/sistema-puntajes/trivia.service';

export const triviasIaMcpTools = (triviaService: TriviaService) => [
  {
    name: 'crear_trivia',
    description: 'Registra una nueva trivia para la semana indicada. Solo puede existir una trivia activa por día. Sera una por cada dia de la semana.',
    inputSchema: {
      type: 'object',
      properties: {
        titulo: { type: 'string', description: 'Título de la trivia, ej: "Trivia de Romanos"' },
        semana: { type: 'string', description: 'Semana de la trivia, ej: "semana-36" (semana actual del año) '},
      },
      required: ['titulo', 'semana'],
    },
    execute: async (args: any) => {
      return await triviaService.crearTrivia(args.titulo, args.semana);
    },
  },
];
