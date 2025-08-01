import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateMiembroCasaDeFeDto } from './dto/create-miembro-casa-de-fe.dto';
import { UpdateMiembroCasaDeFeDto } from './dto/update-miembro-casa-de-fe.dto';
import { MiembroCasaDeFe } from './entities/miembro-casa-de-fe.entity';
import { CasasDeFe } from 'src/casas-de-fe/entities/casas-de-fe.entity';
import { AddAsistenciaDto } from './dto/addAsistencia.dto';
import { AsistenciasService } from 'src/asistencias/asistencias.service';

@Injectable()
export class MiembroCasaDeFeService {
  constructor(
    @InjectRepository(MiembroCasaDeFe)
    private readonly miembroCasaDeFeRepository: Repository<MiembroCasaDeFe>,

    @InjectRepository(CasasDeFe)
    private readonly casasDeFeRepository: Repository<CasasDeFe>,

    private readonly asistenciasService: AsistenciasService,
  ) {}

  async create(createDto: CreateMiembroCasaDeFeDto) {
    const casa = await this.casasDeFeRepository.findOne({
      where: { id: createDto.casasDeFeId },
    });

    if (!casa) throw new NotFoundException('Casa de Fe no encontrada');

    const nuevoMiembro = this.miembroCasaDeFeRepository.create(createDto);
    nuevoMiembro.casasDeFe = casa;

    return this.miembroCasaDeFeRepository.save(nuevoMiembro);
  }
  async AgregarAsistenciaComoMiembro(
    addAsistenciaDto: AddAsistenciaDto,
  ) {
    const asistencia = await this.asistenciasService.findOneById(
      addAsistenciaDto.asistenciaId,
    );
    const casaDeFe = await this.casasDeFeRepository.findOne({
      where: { id: addAsistenciaDto.casasDeFeId },
    });
    if (!casaDeFe) throw new NotFoundException('Casa de Fe no encontrada');
    const createMiembroCasaDeFeDto: CreateMiembroCasaDeFeDto = {
      nombre: asistencia.nombre,
      apellido: asistencia.apellido,
      telefono: asistencia.telefono,
      direccion: asistencia.direccion,
      casasDeFeId: casaDeFe.id,
    }
    await this.asistenciasService.remove(asistencia.id);
    return await this.create(createMiembroCasaDeFeDto);
  }

  async findAll() {
    return this.miembroCasaDeFeRepository.find({
      relations: ['casasDeFe'],
    });
  }

  async findOne(id: number) {
    const miembro = await this.miembroCasaDeFeRepository.findOne({
      where: { id },
      relations: ['casasDeFe'],
    });

    if (!miembro) throw new NotFoundException('Miembro no encontrado');
    return miembro;
  }

  async update(id: number, updateDto: UpdateMiembroCasaDeFeDto) {
    const miembro = await this.miembroCasaDeFeRepository.findOne({
      where: { id },
    });
    if (!miembro) throw new NotFoundException('Miembro no encontrado');

    Object.assign(miembro, updateDto);
    return this.miembroCasaDeFeRepository.save(miembro);
  }

  async remove(id: number) {
    const miembro = await this.miembroCasaDeFeRepository.findOne({
      where: { id },
    });
    if (!miembro) throw new NotFoundException('Miembro no encontrado');

    await this.miembroCasaDeFeRepository.remove(miembro);
    return { message: 'Eliminado correctamente' };
  }
}
