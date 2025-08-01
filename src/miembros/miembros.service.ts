import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { Between, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Miembro } from './entities/miembro.entity';
import * as bcrypt from 'bcrypt';
import { Rol } from 'src/roles/enum/roles.enum';
import { Horario } from './enum/horario.enum';
import { Aseo } from 'src/aseos/entities/aseo.entity';
import { WhatsappBotService } from 'src/whatsapp-bot/whatsapp-bot.service';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import { Cargo } from './enum/cargo.enum';
import { ContratosService } from 'src/contratos/contratos.service';
import { Modo } from './enum/modo.enum';
@Injectable()
export class MiembrosService {
  constructor(
    @InjectRepository(Miembro) private miembroRepository: Repository<Miembro>,
    @InjectRepository(Aseo) private aseoRepository: Repository<Aseo>,
    private readonly manejoDeMensajesService: ManejoDeMensajesService,
    private readonly contratoService: ContratosService,
  ) {}
  async create(createMiembroDto: CreateMiembroDto) {
    // Limpieza del número (elimina espacios, guiones, paréntesis, etc.)
    let numero = createMiembroDto.telefono.replace(/\D/g, '');

    // Validación y normalización del número
    if (/^57\d{10}$/.test(numero)) {
      // Ya es un número internacional válido
    } else if (/^\d{10}$/.test(numero)) {
      // Es un número nacional, se convierte a internacional
      numero = '57' + numero;
    } else {
      throw new BadRequestException(
        'Número de teléfono inválido. Debe tener 10 dígitos o comenzar con 57.',
      );
    }

    // Verificación de miembro existente
    const findMiembro = await this.miembroRepository.findOne({
      where: {
        user: createMiembroDto.user,
        telefono: numero,
      },
    });

    if (findMiembro) {
      throw new BadRequestException('Miembro ya registrado');
    }

    const hashedPassword = await bcrypt.hash(createMiembroDto.password, 10);

    const nuevoMiembro = this.miembroRepository.create({
      name: createMiembroDto.name,
      apellido: createMiembroDto.apellido,
      user: createMiembroDto.user,
      password: hashedPassword,
      telefono: numero, // teléfono ya validado
      rol: createMiembroDto.rol,
      cargo: createMiembroDto.cargo,
      horario_aseo: createMiembroDto.horario_aseo,
    });

    const savedMiembro = await this.miembroRepository.save(nuevoMiembro);

    await this.contratoService.create({
      firma: createMiembroDto.firma,
      vigente: true,
      miembroId: savedMiembro.id,
    });

    // 🚀 Enviar mensaje por WhatsApp
    const chatId = `${savedMiembro.telefono}@c.us`;
    const mensaje = `*Creación de cuenta CFE San Pelayo*
*Nota:* Este mensaje es automático y la IA no tiene contexto sobre el contenido.

Hola *${savedMiembro.rol} ${savedMiembro.name} ${savedMiembro.apellido}*, tu cuenta ha sido creada exitosamente en la plataforma de CFE San Pelayo.
Datos personales:
Su usuario es: *${savedMiembro.user}*
Su contraseña es: *${createMiembroDto.password}*
Su rol es: *${savedMiembro.rol}*
Su cargo es: *${savedMiembro.cargo}*
Su dia de aseo preferido es: *${savedMiembro.horario_aseo}* (Inicia sesión para cambiarlo)

¡Bienvenido a la iglesia de CFE San Pelayo!

A partir de ahora recibirás por este medio notificaciones importantes como asignaciones de aseo, recordatorios y personas cerca de tu casa de fe.

¡Gracias por ser parte activa de nuestra comunidad!
> CENTRO DE FE Y ESPERANZA SAN PELAYO`;

    try {
      await this.manejoDeMensajesService.guardarMensaje(chatId, mensaje);
    } catch (error) {
      throw new BadRequestException(
        'No se pudo enviar el mensaje. Asegúrate de que el número haya agregado al bot y haya enviado un "Hola" primero.',
      );
    }
    return {
      id: savedMiembro.id,
      name: savedMiembro.name,
      apellido: savedMiembro.apellido,
      telefono: savedMiembro.telefono,
      rol: savedMiembro.rol,
      firma: createMiembroDto.firma,
    };
  }

  async cambiarModoRespuesta(telefono: string, modo: string) {
    if (!telefono.startsWith('57')) {
      telefono = '57' + telefono;
    }
    const miembro = await this.findOneByTelefono(telefono);
    console.log(miembro);

    if (!miembro) {
      return { message: 'Miembro no encontrado.' };
    }
    try {
      miembro.modo_respuesta = modo;
      await this.miembroRepository.save(miembro);
      console.log(await this.miembroRepository.save(miembro));
      return 'Modo de respuesta cambiado exitosamente.';
    } catch (error) {
      console.error('Error al cambiar el modo de respuesta:', error);
      ('Error al cambiar el modo de respuesta.');
    }
  }

  async obtenerModoRespuesta(telefono: string): Promise<string> {
    const miembro = await this.miembroRepository.findOne({
      where: { telefono },
    });
    return miembro?.modo_respuesta ?? 'texto';
  }

  // async poblarMiembrosDePrueba(cantidad: number) {
  //   const horarios = [Horario.DOMINGO, Horario.JUEVES, Horario.ANY];

  //   console.log(cantidad);
  //   for (let i = 1; i <= cantidad; i++) {
  //     await this.create({
  //       name: `Miembro${i}`,
  //       apellido: `Prueba`,
  //       telefono: `312346${i.toString().padStart(2, '0')}`,
  //       user: `user${i.toString().padStart(2, '0')}`,
  //       password: `password${i.toString().padStart(2, '0')}`,
  //       rol: Rol.SERVIDOR,
  //       cargo: Cargo.SERVIDOR,
  //       horario_aseo: horarios[Math.floor(Math.random() * horarios.length)],
  //     });
  //   }

  //   return { mensaje: `${cantidad} miembros creados con horario aleatorio.` };
  // }

  async findAll() {
    const miembros = await this.miembroRepository.find();
    if (!miembros) {
      throw new BadRequestException('Miembros no encontrados');
    }
    return {
      miembros: miembros.map((miembro) => ({
        id: miembro.id,
        name: miembro.name,
        apellido: miembro.apellido,
        telefono: miembro.telefono,
        rol: miembro.rol,
        disponibilidad_aseo: miembro.disponibilidad_aseo,
        horario_aseo: miembro.horario_aseo,
      })),
    };
  }
  async findAllMembers() {
    const miembros = await this.miembroRepository.find({
      where: { activo: true },
    });
    if (!miembros) {
      throw new BadRequestException('Miembros no encontrados');
    }
    return miembros;
  }

  async getMiembros() {
    const miembros = await this.miembroRepository.find();
    if (!miembros) {
      throw new BadRequestException('Miembros no encontrados');
    }
    return {
      miembros: miembros.map((miembro) => ({
        id: miembro.id,
        name: miembro.name,
        apellido: miembro.apellido,
        telefono: miembro.telefono,
        rol: miembro.rol,
        cargo: miembro.cargo,
        activo: miembro.activo,

        disponibilidad_aseo: miembro.disponibilidad_aseo,
        horario_aseo: miembro.horario_aseo,
      })),
    };
  }

  async findOne(id: number) {
    const miembro = await this.miembroRepository.findOne({ where: { id } });
    if (!miembro) {
      throw new BadRequestException('Miembro no encontrado');
    }
    return {
      id: miembro.id,
      name: miembro.name,
      apellido: miembro.apellido,
      telefono: miembro.telefono,
      rol: miembro.rol,
      disponibilidad_aseo: miembro.disponibilidad_aseo,
      horario_aseo: miembro.horario_aseo,
    };
  }
  async findAsignedAseosCurrentMonthById(miembroId: number) {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    const aseos = await this.aseoRepository.find({
      where: {
        miembro: { id: miembroId },
        fecha: Between(inicioMes, finMes),
      },
      relations: ['miembro'], // opcional, si quieres info del miembro
    });

    if (!aseos.length) {
      return {
        status: 404,
        message: 'No se encontraron aseos asignados en el mes actual',
      };
    }

    return aseos;
  }
  async findOneByTelefono(telefono: string) {
    if (!telefono.startsWith('57')) {
      telefono = '57' + telefono;
    }
    const miembro = await this.miembroRepository.findOne({
      where: { telefono: telefono.trim() },
    });
    return miembro;
  }
  async countMiembros() {
    const count = await this.miembroRepository.count({
      where: { activo: true },
    });
    return count;
  }
  async findOneByUser(user: string) {
    const miembro = await this.miembroRepository.findOne({ where: { user } });
    if (!miembro) {
      throw new BadRequestException('Miembro no encontrado');
    }
    return miembro;
  }
  async update(id: number, updateMiembroDto: UpdateMiembroDto) {
    const findMiembro = await this.miembroRepository.findOne({ where: { id } });
    if (!findMiembro) {
      throw new BadRequestException('Miembro no encontrado');
    }
    try {
      await this.miembroRepository.update(id, updateMiembroDto);
      return {
        message: 'Miembro actualizado con exito',
        status: 200,
      };
    } catch (error) {
      throw new BadRequestException(
        'Error al actualizar miembro',
        error.message,
      );
    }
  }
  async updateHorarioAseo(id: number, updateMiembroDto: UpdateMiembroDto) {
    const miembro = await this.miembroRepository.findOne({ where: { id } });

    if (!miembro) {
      throw new BadRequestException('Miembro no encontrado');
    }

    try {
      await this.miembroRepository.save({
        ...miembro,
        horario_aseo: updateMiembroDto.horario_aseo,
      });

      return {
        message: 'Horario de aseo actualizado con éxito',
        status: 200,
        horario_aseo: updateMiembroDto.horario_aseo,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al actualizar miembro: ${error.message}`,
      );
    }
  }
  async updateHorarioAseoIA(id: number, horario_aseo: Horario) {
    const miembro = await this.miembroRepository.findOne({ where: { id } });

    if (!miembro) {
      throw new BadRequestException('Miembro no encontrado');
    }

    try {
      miembro.horario_aseo = horario_aseo;
      await this.miembroRepository.save(miembro);

      return 'Dia de aseo preferido actualizado con exito';
    } catch (error) {
      throw new BadRequestException(
        `Error al actualizar miembro: ${error.message}`,
      );
    }
  }

  async remove(id: number) {
    const findMiembro = await this.miembroRepository.findOne({ where: { id } });
    if (!findMiembro) {
      throw new BadRequestException('Miembro no encontrado');
    }
    try {
      await this.miembroRepository.delete(id);
      return {
        message: 'Miembro eliminado con exito',
        status: 200,
      };
    } catch (error) {
      throw new BadRequestException('Error al eliminar miembro', error.message);
    }
  }

  async softDelete(id: number) {
    const findMiembro = await this.miembroRepository.findOne({ where: { id } });

    if (!findMiembro) {
      throw new BadRequestException('Miembro no encontrado');
    }

    try {
      findMiembro.activo = false;
      await this.miembroRepository.save(findMiembro);

      return {
        message: 'Miembro desactivado con éxito',
        status: 200,
      };
    } catch (error) {
      throw new BadRequestException({
        message: 'Error al desactivar miembro',
        error: error.message,
      });
    }
  }
}
