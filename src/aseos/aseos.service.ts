import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateAseoDto } from './dto/create-aseo.dto';
import { UpdateAseoDto } from './dto/update-aseo.dto';
import { Aseo } from './entities/aseo.entity';
import { Between, In, Repository } from 'typeorm';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import dayjs from 'dayjs'; // ✅ Así funciona siempre con TypeScript y CommonJS
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';

@Injectable()
export class AseosService {
  private readonly logger = new Logger(AseosService.name);
  constructor(
    @InjectRepository(Aseo)
    private readonly aseoRepository: Repository<Aseo>,
    @InjectRepository(Miembro)
    private readonly miembroRepository: Repository<Miembro>,
    private readonly manejoMensajesService: ManejoDeMensajesService,
  ) {}
  async create(createAseoDto: CreateAseoDto) {
    const miembro = await this.miembroRepository.findOne({
      where: { id: createAseoDto.miembroId }, // ✅ OK: se espera un objeto
    });

    if (!miembro) {
      throw new NotFoundException('Miembro no encontrado');
    }

    const fecha = new Date(createAseoDto.fecha);
    if (isNaN(fecha.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }

    const aseo = this.aseoRepository.create({
      miembro,
      fecha: new Date(createAseoDto.fecha),
    });

    return await this.aseoRepository.save(aseo);
  }

  async existeAsignacionEnFecha(miembroId: number, fecha: Date) {
    return this.aseoRepository.findOne({
      where: {
        miembro: { id: miembroId },
        fecha: fecha, // fecha exacta
      },
    });
  }

  async getAsignacionesAgrupadasPorMes(): Promise<Record<string, any[]>> {
    const asignaciones = await this.aseoRepository.find({
      relations: ['miembro'],
      order: { fecha: 'ASC' },
    });

    const agrupado: Record<string, any[]> = {};

    for (const aseo of asignaciones) {
      const mes = dayjs(aseo.fecha).format('YYYY-MM');

      if (!agrupado[mes]) {
        agrupado[mes] = [];
      }

      agrupado[mes].push({
        fecha: dayjs(aseo.fecha).format('YYYY-MM-DD'),
        miembro: {
          id: aseo.miembro.id,
          name: aseo.miembro.name,
          apellido: aseo.miembro.apellido,
          // agrega otros campos si los necesitas
        },
      });
    }

    return agrupado;
  }
  async existeAseoParaMes(anio: number, mes: number) {
    const inicio = dayjs(`${anio}-${mes}-01`).startOf('month').toDate();
    const fin = dayjs(inicio).endOf('month').toDate();

    const total = await this.aseoRepository.count({
      where: {
        fecha: Between(inicio, fin),
      },
    });

    return total > 0;
  }

  findOne(id: number) {
    return `This action returns a #${id} aseo`;
  }
  async findAsignedAseosCurrentMonthById(id: number) {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    const aseos = await this.aseoRepository.find({
      where: {
        miembro: { id: id },
        fecha: Between(inicioMes, finMes),
      },
      relations: ['miembro'], // opcional, si quieres info del miembro
    });
    return aseos;
  }
  async findAsignedAseosNextMonthById(id: number) {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0);

    const aseos = await this.aseoRepository.find({
      where: {
        miembro: { id: id },
        fecha: Between(inicioMes, finMes),
      },
      relations: ['miembro'], // opcional, si quieres info del miembro
    });
    return aseos;
  }
  // Cron todos los días a las 13:00 hora Colombia
  @Cron('0 13 * * *')
  async recordatorioAseoTomorrow() {
    const hoy = new Date();

    // Se calcula mañana
    const manana = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() + 1,
    );
    this.logger.log(`⏰ Ejecutando tarea de recordatorio de aseo para ${manana.toDateString()}`);
    // Rango de búsqueda para todo el día siguiente
    const fechaInicio = new Date(manana.setHours(0, 0, 0, 0));
    const fechaFin = new Date(manana.setHours(23, 59, 59, 999));

    // Buscar asignaciones de aseo para mañana
    const aseos = await this.aseoRepository.find({
      where: { fecha: Between(fechaInicio, fechaFin) },
      relations: ['miembro'],
    });

    if (aseos.length === 0) {
      this.logger.log('✅ No hay aseos programados para mañana.');
      return;
    }

    for (const aseo of aseos) {
      const { miembro, fecha } = aseo;

      // Filtrar los demás asignados el mismo día (excluyendo al actual)
      const otros = aseos
        .filter((a) => a.miembro.id !== miembro.id)
        .map((a) => a.miembro);

      // Mensaje personalizado
      const mensaje = `*⏰ Recordatorio de aseo - CFES San Pelayo*

Hola estimado/a *${miembro.name}*,

Te recordamos que *mañana (${dayjs(fecha)
        .locale('es')
        .format(
          'dddd DD [de] MMMM [de] YYYY',
        )})* has sido asignado/a para el aseo en el templo.

Los compañeros que servirán contigo son:
${
  otros.length > 0
    ? otros.map((m) => `* *${m.name} ${m.apellido}*`).join('\n')
    : '*Ninguno (No hay suficientes miembros disponibles)*'
}.

🙏 Te agradecemos tu disposición y compromiso.
> *Centro de Fe y Esperanza - San Pelayo*`;

      try {
        // await this.manejoMensajesService.guardarMensaje(
        //   `${miembro.telefono}`,
        //   mensaje,
        //   'Sistema',
        // );
        this.logger.log(`📤 Recordatorio enviado a ${miembro.name}`);
      } catch (error) {
        this.logger.error(
          `❌ Error al enviar recordatorio a ${miembro.name}: ${error.message}`,
        );
      }
    }
  }
  async buscarEncargadosdeAseoPorFechas(fechas: string[]) {
    const encargados = await this.aseoRepository.find({
      where: {
        fecha: In(fechas),
      },
      relations: ['miembro'],
    });

    // Opcional: solo devolver nombres y teléfonos
    return encargados.map((a) => ({
      nombre: a.miembro?.name,
      apellido: a.miembro?.apellido,
      telefono: a.miembro?.telefono,
      fecha: a.fecha,
    }));
  }

  update(id: number, updateAseoDto: UpdateAseoDto) {
    return `This action updates a #${id} aseo`;
  }

  remove(id: number) {
    return `This action removes a #${id} aseo`;
  }
}
