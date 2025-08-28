import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { Evento } from './entities/evento.entity';
import { Between, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventosRepository: Repository<Evento>,
  ) {}
  async create(createEventoDto: CreateEventoDto) {
    const findEvento = await this.eventosRepository.findOneBy({
      name: createEventoDto.name,
    });
    // if (findEvento) {
    //   throw new ConflictException('El evento ya existe');
    // }
    const evento = this.eventosRepository.create(createEventoDto);
    return await this.eventosRepository.save(evento);
  }

  async findAll() {
    const eventos = await this.eventosRepository.find();
    if (!eventos) {
      throw new NotFoundException('Eventos no encontrados');
    }
    return eventos;
  }
  async findAllAgrupadoPorMes() {
    const eventos = await this.eventosRepository.find();

    if (!eventos || eventos.length === 0) {
      throw new NotFoundException('Eventos no encontrados');
    }

    const agrupados = eventos.reduce((acc, evento) => {
      
      const fecha = new Date(`${evento.date}T12:00:00`); // Medio día → menos chance de desajuste por zona

      
      const claveMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`; // ✅ CORREGIDO
      
      if (!acc[claveMes]) {
        acc[claveMes] = [];
      }

      acc[claveMes].push(evento);
      return acc;
    }, {});

    return agrupados;
  }
 async findEventosByMonth(month: number, year: number) {
  const inicioMes = new Date(year, month - 1, 1); // primer día del mes
  const finMes = new Date(year, month, 0, 23, 59, 59); // último día del mes

  const eventos = await this.eventosRepository.find({
    where: {
      date: Between(inicioMes, finMes),
    },
  });

  if (!eventos || eventos.length === 0) {
    throw new NotFoundException('Eventos no encontrados');
  }

  return eventos;
}

  async findOne(id: number) {
    const evento = await this.eventosRepository.findOneBy({ id });
    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }
    return evento;
  }
  async countEventos(): Promise<number> {
    try {
      const total = await this.eventosRepository.count();
      console.log('Total de eventos:', total);
      if (total === 0) {
        throw new NotFoundException('No hay eventos registrados');
      }
      return total;
    } catch (error) {
      throw new InternalServerErrorException('Error al contar eventos');
    }
  }
  async countEventosThisMonth(): Promise<number> {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const eventos = await this.eventosRepository.find({
        where: {
          date: Between(startOfMonth, endOfMonth),
        },
      });
      return eventos.length;
    } catch (error) {
      throw new InternalServerErrorException('Error al contar eventos');
    }
  }

  async update(id: number, updateEventoDto: UpdateEventoDto) {
    const evento = await this.eventosRepository.findOneBy({ id });
    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }
    return await this.eventosRepository.update(id, updateEventoDto);
  }

  async remove(id: number) {
    const evento = await this.eventosRepository.findOneBy({ id });
    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }
    return await this.eventosRepository.remove(evento);
  }
}
