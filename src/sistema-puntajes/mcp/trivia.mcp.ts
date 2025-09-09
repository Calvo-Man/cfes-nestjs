// src/mcp/trivias-ia.mcp.ts
import { TriviaService } from 'src/sistema-puntajes/trivia.service';
function getSemanaActual(): string {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = Math.floor(
    (now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((pastDaysOfYear + oneJan.getDay() + 1) / 7);
  return `semana-${weekNumber}`;
}

export const triviasIaMcpTools = (triviaService: TriviaService) => [
  {
    name: 'crear_trivia',
    description: 'Registra una nueva trivia para la semana actual. Solo puede existir una trivia activa por día. Sera una por cada dia de la semana.',
    inputSchema: {
      type: 'object',
      properties: {
        titulo: { type: 'string', description: 'Título de la trivia, ej: "Trivia de Romanos"' },
      },
      required: ['titulo'],
    },
    execute: async (args: any) => {
      const semana = getSemanaActual();
      return await triviaService.crearTrivia(args.titulo, semana);
    },
  },
];
