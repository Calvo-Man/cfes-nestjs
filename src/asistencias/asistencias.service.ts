// asistencias.service.ts
import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';

import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import moment from 'moment-timezone';
import { Asistencia } from './entities/asistencia.entity';
import { CasasDeFe } from 'src/casas-de-fe/entities/casas-de-fe.entity';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';

@Injectable()
export class AsistenciasService {
  constructor(
    @InjectRepository(Asistencia)
    private asistenciaRepository: Repository<Asistencia>,
    @Inject(forwardRef(() => ManejoDeMensajesService))
    private manejoDeMensajesService: ManejoDeMensajesService,
  ) {}

  async create(createAsistenciaDto: CreateAsistenciaDto) {
    const fechaColombia = moment().tz('America/Bogota').toDate();

    const asistenciaExistente = await this.asistenciaRepository.findOne({
      where: { telefono: createAsistenciaDto.telefono },
    });
    if (asistenciaExistente) {
      throw new ConflictException(
        'Ya existe una asistencia con el mismo telefono',
      );
    }
    const nuevaAsistencia = this.asistenciaRepository.create({
      ...createAsistenciaDto,
      fecha: fechaColombia,
    });

    await this.asistenciaRepository.save(nuevaAsistencia);
    const mensaje = `
Hola ${createAsistenciaDto.nombre} 👋  
¡Qué alegría tenerte hoy en la iglesia! 🙌✨   
Esperamos verte de nuevo. Bendiciones 🙏
`;

    const telefono = createAsistenciaDto.telefono.startsWith('57')
      ? createAsistenciaDto.telefono
      : '57' + createAsistenciaDto.telefono;
    await this.manejoDeMensajesService.guardarMensaje(
      telefono,
      mensaje,
      'asistencia',
    );
    return {
      message: 'Asistencia creada exitosamente',
      status: 201,
    };
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
  async findRecurrentes() {
    const asistencias = await this.asistenciaRepository.find({
      where: { recurrente: true },
      order: { id: 'DESC' }, // o 'DESC' si quieres los más recientes primero
    });
    if (!asistencias) {
      throw new NotFoundException('Asistencias no encontradas');
    }
    return asistencias;
  }
  async findNoRecurrentes() {
    const asistencias = await this.asistenciaRepository.find({
      where: { recurrente: false },
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

  async countAsistenciasPorMeses(ultimosMeses = 12) {
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

    const result = await this.asistenciaRepository
      .createQueryBuilder('a')
      .select('EXTRACT(YEAR FROM a.fecha)', 'anio')
      .addSelect('EXTRACT(MONTH FROM a.fecha)', 'mes')
      .addSelect('COUNT(*)', 'total')
      .where('a.fecha >= :primerDia', { primerDia })
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
    }[] = []; // ✅ Aquí tipamos

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

  async update(id: number, updateAsistenciaDto: CreateAsistenciaDto) {
    const asistencia = await this.asistenciaRepository.findOne({
      where: { id },
    });
    if (!asistencia) {
      throw new NotFoundException('Asistencia no encontrada');
    }
    return await this.asistenciaRepository.update(id, updateAsistenciaDto);
  }
  async setRecurrente(id: number) {
    try {
    const asistencia = await this.asistenciaRepository.findOne({
      where: { id },
    });
    if (!asistencia) {
      throw new NotFoundException('Asistencia no encontrada');
    }
    asistencia.recurrente = !asistencia.recurrente;
    await this.asistenciaRepository.save(asistencia);
    return {
      id: asistencia.id,
      message: `Asistencia actualizada a ${asistencia.recurrente ? 'recurrente' : 'no recurrente'}`,
      color: asistencia.recurrente ? 'success' : 'error',
    }
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar la asistencia');
    }
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
