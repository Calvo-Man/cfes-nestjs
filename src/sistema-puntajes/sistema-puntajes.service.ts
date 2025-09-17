// src/puntajes/sistema-puntaje.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puntaje } from './entities/puntaje.entity';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { Trivia } from './entities/trivia.entity';
import { PuntajeSemanal } from './entities/puntaje-semanal.entity';

@Injectable()
export class PuntajeService {
  constructor(
    @InjectRepository(Puntaje)
    private readonly puntajeRepo: Repository<Puntaje>,
    @InjectRepository(Miembro)
    private readonly miembroRepo: Repository<Miembro>,
    @InjectRepository(Trivia)
    private readonly triviaRepo: Repository<Trivia>,
    @InjectRepository(PuntajeSemanal)
    private readonly puntajeSemanalRepo: Repository<PuntajeSemanal>,
  ) {}

  // 🔹 Crear puntaje cuando un miembro empieza una trivia
  async registrarInicio(triviaId: number, miembroId: number) {
    const trivia = await this.triviaRepo.findOne({ where: { id: triviaId } });
    if (!trivia) throw new NotFoundException('Trivia no encontrada.');

    const miembro = await this.miembroRepo.findOne({
      where: { id: miembroId },
    });
    if (!miembro) throw new NotFoundException('Miembro no encontrado.');

    const puntaje = this.puntajeRepo.create({
      miembro,
      trivia,
      semana: trivia.semana,
      puntos: 0,
      correctas: 0,
      incorrectas: 0,
    });

    const savedPuntaje = await this.puntajeRepo.save(puntaje);

    const puntajeSemanal = await this.puntajeSemanalRepo.findOne({
      where: { miembro: { id: miembroId }, semana: trivia.semana },
    });

    if (!puntajeSemanal) {
      await this.puntajeSemanalRepo.save({
        miembro,
        semana: trivia.semana,
        puntos: 0,
        correctas: 0,
        incorrectas: 0,
      });
      return savedPuntaje;
    }
    return puntajeSemanal;
  }

  // 🔹 Guardar puntaje final cuando la IA termina la trivia para un miembro
  async registrarResultado(
    triviaId: number,
    miembroId: number,
    puntos: number,
    correctas: number,
    incorrectas: number,
  ) {
    const trivia = await this.triviaRepo.findOne({ where: { id: triviaId } });
    if (!trivia) throw new NotFoundException('Trivia no encontrada.');

    const miembro = await this.miembroRepo.findOne({
      where: { id: miembroId },
    });
    if (!miembro) throw new NotFoundException('Miembro no encontrado.');
    const existingPuntaje = await this.puntajeRepo.findOne({
      where: { miembro: { id: miembroId }, trivia: { id: triviaId }, finalizado: false },
    });
    if (!existingPuntaje) {
      return 'El puntaje no existe, o ya fue finalizado previamente. intente registrar el inicio de la trivia primero.';
    }
      existingPuntaje.puntos = puntos;
      existingPuntaje.correctas = correctas;
      existingPuntaje.incorrectas = incorrectas;
      existingPuntaje.finalizado = true;
      await this.puntajeRepo.save(existingPuntaje);
    

    // 2️⃣ Acumular en puntaje semanal
    let puntajeSemanal = await this.puntajeSemanalRepo.findOne({
      where: { miembro: { id: miembroId }, semana: trivia.semana },
    });

    if (!puntajeSemanal) {
      puntajeSemanal = this.puntajeSemanalRepo.create({
        miembro,
        semana: trivia.semana,
        puntos,
        correctas,
        incorrectas,
        finalizado: false,
      });
    } else {
      puntajeSemanal.puntos += puntos;
      puntajeSemanal.correctas += correctas;
      puntajeSemanal.incorrectas += incorrectas;
    }

    return this.puntajeSemanalRepo.save(puntajeSemanal);
  }

  // 🔹 Obtener podio semanal (top 3)
  async obtenerPodio(semana: string,cantidad: number ) {
    return this.puntajeSemanalRepo.find({
      where: { semana },
      order: { puntos: 'DESC', correctas: 'DESC' },
      take: cantidad,
      relations: ['miembro'],
    });
  }
  async obtenerPuntajesPorMiembro(miembroId: number, semana: string) {
    const miembro = await this.miembroRepo.findOne({
      where: { id: miembroId },
    });
    if (!miembro) throw new NotFoundException('Miembro no encontrado.');
    return this.puntajeSemanalRepo.find({
      where: { miembro: { id: miembroId } , semana: semana },
      order: { semana: 'DESC' },
    });
  }
  async obtenerPuntajeDetalle(miembroId: number, semana: string) {
    const miembro = await this.miembroRepo.findOne({
      where: { id: miembroId },
    });
    if (!miembro) throw new NotFoundException('Miembro no encontrado.');
    return this.puntajeRepo.find({
      where: { miembro: { id: miembroId } , semana: semana },
      order: { puntos: 'DESC' },
      relations: ['trivia'],
    });
  }
}
