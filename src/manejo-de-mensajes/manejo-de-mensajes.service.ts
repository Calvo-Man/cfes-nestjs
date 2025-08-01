// src/mensajes-pendientes/mensajes-pendientes.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensajes } from './entities/manejo-de-mensaje.entity';

@Injectable()
export class ManejoDeMensajesService {
  constructor(
    @InjectRepository(Mensajes)
    private mensasRepository: Repository<Mensajes>,
  ) {}

  async guardarMensaje(telefono: string, contenido: string) {
    const mensaje = this.mensasRepository.create({ telefono, contenido });
    return this.mensasRepository.save(mensaje);
  }

  async obtenerPendientes() {
    return this.mensasRepository.find({ where: { enviado: false } });
  }

  async marcarComoEnviado(id: number) {
    return this.mensasRepository.update(id, { enviado: true });
  }
}
