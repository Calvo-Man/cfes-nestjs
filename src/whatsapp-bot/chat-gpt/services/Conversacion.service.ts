// src/conversaciones/conversaciones.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialMensajes } from '../entities/historialMensajes.entity';

@Injectable()
export class ConversacionesService {
  constructor(
    @InjectRepository(HistorialMensajes)
    private repo: Repository<HistorialMensajes>,
  ) {}

  async registrarMensaje(
    telefono: string,
    rol: 'user' | 'assistant' | 'tool' | 'system',
    contenido: string,
  ) {
    const nuevo = this.repo.create({ telefono, rol, contenido });
    return this.repo.save(nuevo);
  }

  async obtenerHistorial(telefono: string, limite = 20) {
  const mensajes = await this.repo.find({
    where: { telefono },
    order: { creadoEn: 'DESC' },
    take: limite,
  });
  return mensajes.reverse(); // viejo → nuevo
}
async obtenerHistorialParaIA(telefono: string, limite = 20) {
  const mensajes = await this.obtenerHistorial(telefono, limite);
  return mensajes.map((m) => ({
    role: m.rol,
    content: m.contenido,
  }));
}

}
