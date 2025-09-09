// src/trivias/trivia.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trivia } from './entities/trivia.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TriviaService {
  constructor(
    @InjectRepository(Trivia)
    private readonly triviaRepo: Repository<Trivia>,
  ) {}

  // 🔹 Crear UNA trivia global para la semana
  // 🔹 Crear UNA trivia global por día
  async crearTrivia(titulo: string, semana: string) {
    try {
      const hoy = new Date();
      const yyyy = hoy.getFullYear();
      const mm = (hoy.getMonth() + 1).toString().padStart(2, '0');
      const dd = hoy.getDate().toString().padStart(2, '0');
      const fechaHoy = `${yyyy}-${mm}-${dd}`;

      // Verificar si ya existe una trivia activa para hoy
      const existente = await this.triviaRepo.findOne({
        where: { fecha: fechaHoy, finalizada: false, semana: semana },
      });

      if (existente) {
        throw new Error('Ya existe una trivia activa para hoy.');
      }

      const trivia = this.triviaRepo.create({
        titulo,
        semana,
        fecha: fechaHoy,
        finalizada: false,
      });

      return this.triviaRepo.save(trivia);
    } catch (error) {
      throw new Error(`Error al crear trivia: ${error.message}`);
    }
  }

  // 🔹 Se ejecuta cada día a medianoche
  @Cron('0 5 * * *')
  async finalizarTriviasDelDia() {
    // Cierra todas las trivias activas con fecha de hoy
    try {
      const trivia = await this.triviaRepo.findOne({
        where: { finalizada: false },
      });
      if (!trivia) {
        console.log('No hay trivias activas para finalizar.');
        return;
      }

      trivia.finalizada = true;
      await this.triviaRepo.save(trivia);
      console.log(`trivia finalizada automáticamente`);
    } catch (error) {
      console.error('Error al finalizar trivias del día:', error);
    }
  }
}
