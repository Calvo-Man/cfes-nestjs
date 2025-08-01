// asistencias.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';

import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import moment from 'moment-timezone';
import { Asistencia } from './entities/asistencia.entity';
import { CasasDeFe } from 'src/casas-de-fe/entities/casas-de-fe.entity';

@Injectable()
export class AsistenciasService {
  constructor(
    @InjectRepository(Asistencia)
    private asistenciaRepository: Repository<Asistencia>,
  ) {}

  async create(createAsistenciaDto: CreateAsistenciaDto): Promise<Asistencia> {
    const fechaColombia = moment().tz('America/Bogota').toDate();

    const nuevaAsistencia = this.asistenciaRepository.create({
      ...createAsistenciaDto,
      fecha: fechaColombia,
    });

    return await this.asistenciaRepository.save(nuevaAsistencia);
  }

  async MensajeEnviado(id: number) {
    const asistencia = await this.asistenciaRepository.findOne({
      where: { id },
    });
    if (!asistencia) {
      throw new NotFoundException('Asistencia no encontrada');
    }
    asistencia.mensaje_enviado = true;
    return await this.asistenciaRepository.save(asistencia);
  }

  async findAll() {
    const asistencias = await this.asistenciaRepository.find({
      order: { id: 'DESC' }, // o 'DESC' si quieres los más recientes primero
    });
    if (!asistencias) {
      throw new NotFoundException('Asistencias no encontradas');
    }
    return asistencias;
  }

  async findOneById(id: number) {
    const asistencia = await this.asistenciaRepository.findOne({
      where: { id },
    });
    if (!asistencia) {
      throw new NotFoundException('Asistencia no encontrada');
    }
    return asistencia;
  }

  async countAsistencias() {
    const count = await this.asistenciaRepository.count();
    return count;
  }
  async countAsistenciasThisMonth() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const count = await this.asistenciaRepository.count({
      where: {
        fecha: Between(startOfMonth, endOfMonth),
      },
    });
    return count;
  }

  async update(id: number, updateAsistenciaDto: CreateAsistenciaDto) {
    const asistencia = await this.asistenciaRepository.findOne({
      where: { id },
    });
    if (!asistencia) {
      throw new NotFoundException('Asistencia no encontrada');
    }
    return await this.asistenciaRepository.update(id, updateAsistenciaDto);
  }
  async asignarCasaDeFe(id: number, casaDeFe: CasasDeFe) {
    const asistencia = await this.asistenciaRepository.findOne({
      where: { id },
    });
    if (!asistencia) {
      throw new NotFoundException('Asistencia no encontrada');
    }
    asistencia.casasDeFe = casaDeFe;
    return await this.asistenciaRepository.save(asistencia);
  }

  async remove(id: number) {
    const asistencia = await this.asistenciaRepository.findOne({
      where: { id },
      relations: ['casasDeFe'],
    });

    if (!asistencia) {
      throw new NotFoundException('Asistencia no encontrada');
    }

    asistencia.casasDeFe = null; // rompe la relación
    return this.asistenciaRepository.save(asistencia); // actualiza sin borrar
  }
}
