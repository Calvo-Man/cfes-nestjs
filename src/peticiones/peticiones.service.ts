import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Peticion } from './entities/peticione.entity';
import { CreatePeticionDto } from './dto/create-peticione.dto';
import { UpdatePeticionDto } from './dto/update-peticione.dto';

@Injectable()
export class PeticionesService {
  constructor(
    @InjectRepository(Peticion)
    private readonly peticionesRepository: Repository<Peticion>,
  ) {}

  async crearPeticion(createPeticionDto: CreatePeticionDto): Promise<Peticion> {
    const nuevaPeticion = this.peticionesRepository.create(createPeticionDto);
    return await this.peticionesRepository.save(nuevaPeticion);
  }
  async guardarPeticionPorAgenteIA(
    contenido: string,
    categoria: string,
    telefono: string,
    nombre?: string,
    redaccion?: string,
  ) {
    if (!contenido || contenido.trim().length === 0) {
      return 'El contenido de la petición no puede estar vacío';
    }
    try {
      await this.crearPeticion({
        contenido,
        categoria,
        nombre: nombre || undefined,
        telefono: telefono || undefined,
        redaccion,
        estado: 'pendiente',
      });
      return 'Petición guardada con éxito';
    } catch (error) {
      return `Error al guardar la petición: ${error.message}`;
    }
  }

  async obtenerTodas(): Promise<Peticion[]> {
    return await this.peticionesRepository.find({
      order: { fecha: 'DESC' },
    });
  }
  async obtenerPendientes(): Promise<Peticion[]> {
    return await this.peticionesRepository.find({
      where: { estado: 'pendiente' },
      order: { fecha: 'DESC' },
    });
  }

  async obtenerUna(id: number): Promise<Peticion> {
    const peticion = await this.peticionesRepository.findOneBy({ id });
    if (!peticion) {
      throw new NotFoundException(`Petición con id ${id} no encontrada`);
    }
    return peticion;
  }

async countPeticionesPorMeses(ultimosMeses = 12) {
  const nombresMeses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const hoy = new Date();
  const primerDia = new Date(
    hoy.getFullYear(),
    hoy.getMonth() - (ultimosMeses - 1),
    1,
  );

  const result = await this.peticionesRepository
    .createQueryBuilder('p')
    .select('EXTRACT(YEAR FROM p.fecha)', 'anio')
    .addSelect('EXTRACT(MONTH FROM p.fecha)', 'mes')
    .addSelect('COUNT(*)', 'total')
    .where('p.fecha >= :primerDia', { primerDia })
    .groupBy('anio')
    .addGroupBy('mes')
    .orderBy('anio', 'ASC')
    .addOrderBy('mes', 'ASC')
    .getRawMany();

  const mesesData: {
    anio: number;
    mes: number;
    nombreMes: string;
    total: number;
  }[] = [];

  for (let i = ultimosMeses - 1; i >= 0; i--) {
    const date = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const anio = date.getFullYear();
    const mes = date.getMonth() + 1;
    const registro = result.find(
      (r) => Number(r.anio) === anio && Number(r.mes) === mes,
    );
    mesesData.push({
      anio,
      mes,
      nombreMes: nombresMeses[mes - 1],
      total: registro ? Number(registro.total) : 0,
    });
  }

  return mesesData;
}

  async actualizar(
    id: number,
    updatePeticionDto: UpdatePeticionDto,
  ): Promise<Peticion> {
    const peticion = await this.obtenerUna(id);
    Object.assign(peticion, updatePeticionDto);
    return await this.peticionesRepository.save(peticion);
  }

  async marcarEnOracion(id: number): Promise<Peticion> {
    const peticion = await this.obtenerUna(id);
    peticion.estado = 'en_oracion';
    return await this.peticionesRepository.save(peticion);
  }

  async marcarRespondida(id: number): Promise<Peticion> {
    const peticion = await this.obtenerUna(id);
    peticion.estado = 'respondida';
    return await this.peticionesRepository.save(peticion);
  }

  async eliminar(id: number): Promise<void> {
    const peticion = await this.obtenerUna(id);
    await this.peticionesRepository.remove(peticion);
  }
}
