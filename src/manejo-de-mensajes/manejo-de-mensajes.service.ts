// src/mensajes-pendientes/mensajes-pendientes.service.ts
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensajes } from './entities/manejo-de-mensaje.entity';
import { MiembrosService } from 'src/miembros/miembros.service';
import { CreateManejoDeMensajeDto } from './dto/create-manejo-de-mensaje.dto';
import { AsistenciasService } from 'src/asistencias/asistencias.service';
import { SystemMessagesService } from 'src/whatsapp-bot/chat-gpt/services/SystemMessages.service';

@Injectable()
export class ManejoDeMensajesService {
  constructor(
    @InjectRepository(Mensajes)
    private mensasRepository: Repository<Mensajes>,
    @Inject(forwardRef(() => MiembrosService))
    private miembrosService: MiembrosService,
    private readonly asistenciasService: AsistenciasService,
  ) {}

  // Método para guardar un mensaje en la base de datos para un destinatario especifico
  async guardarMensaje(
    telefono: string,
    contenido: string,
    enviar_por: string,
  ) {
    const mensaje = this.mensasRepository.create({
      telefono,
      contenido,
      enviar_por,
    });
    return this.mensasRepository.save(mensaje);
  }
 
  async guardarMensajeIA(
    telefonoFrom: string,
    telefono: string,
    contenido: string,
    enviar_por: string,
  ) {
    const findMiembrio =
      await this.miembrosService.findOneByTelefono(telefonoFrom);

    if (!findMiembrio) {
      throw new BadRequestException('Miembro no encontrado');
    }
    if(!telefono.startsWith('57')){
      telefono='57'+telefono;
    }
    const mensaje = this.mensasRepository.create({
      telefono,
      contenido,
      enviar_por,
    });
    await this.mensasRepository.save(mensaje);
    return 'El mensaje ha sido guardado y será enviado pronto.';
  }
  // Método para guardar varios mensajes:Lideres,servidores o asistentes
  // Este método recibe un array de categorias y guarda un mensaje para cada uno.
  async guardarVariosMensajes(mensajeDto: CreateManejoDeMensajeDto) {
    const { miembros } = await this.miembrosService.getMiembros();
    const asistentes = await this.asistenciasService.findAll();

    // Array para acumular los destinatarios
    let destinatarios: any[] = [];

    for (const categoria of mensajeDto.enviado_a.map((m) => m.toLowerCase())) {
      let filtrados: any[] = [];

      switch (categoria.toLocaleLowerCase()) {
        case 'pastores':
          filtrados = miembros.filter((m) => m.rol === 'pastor');
          break;
        case 'administradores':
          filtrados = miembros.filter((m) => m.rol === 'administrador');
          break;
        case 'lideres':
          filtrados = miembros.filter((m) => m.rol === 'lider');
          break;
        case 'servidores':
          filtrados = miembros.filter((m) => m.rol === 'servidor');
          break;
        case 'asistentes':
          filtrados = asistentes;
          break;
        case 'jovenes':
          filtrados = asistentes.filter((m) => m.categoria === 'Jovenes');
          break;
        case 'mujeres':
          filtrados = asistentes.filter((m) => m.categoria === 'Mujeres');
          break;
        case 'hombres':
          filtrados = asistentes.filter((m) => m.categoria === 'Hombres');
          break;
        default:
          console.warn(`Categoría desconocida: ${categoria}`);
          continue;
      }

      destinatarios.push(...filtrados);
    }

    // Eliminar duplicados por id
    const destinatariosUnicos = destinatarios.filter(
      (m, index, self) => index === self.findIndex((u) => u.id === m.id),
    );

    // Guardar un mensaje por cada destinatario
    for (const miembro of destinatariosUnicos) {
      if (!miembro.telefono.startsWith('57')) {
        miembro.telefono = '57' + miembro.telefono;
      }
      await this.guardarMensaje(
        miembro.telefono,
        mensajeDto.contenido,
        'sistema',
      );
    }

    return { total: destinatariosUnicos.length };
  }
  async guardarVariosMensajesIA(
    mensajeDto: CreateManejoDeMensajeDto,
    telefonoFrom: string,
  ) {
    const findMiembrio =
      await this.miembrosService.findOneByTelefono(telefonoFrom);

    if (!findMiembrio) {
      throw new BadRequestException(
        'Miembro no encontrado, solo miembros pueden enviar mensajes',
      );
    }
    if (findMiembrio.rol === 'servidor') {
      throw new BadRequestException('Miembro no autorizado');
    }

    const { miembros } = await this.miembrosService.getMiembros();
    const asistentes = await this.asistenciasService.findAll();

    // Array para acumular los destinatarios
    let destinatarios: any[] = [];

    for (const categoria of mensajeDto.enviado_a.map((m) => m.toLowerCase())) {
      let filtrados: any[] = [];

      switch (categoria.toLocaleLowerCase()) {
        case 'miembros':
          filtrados = miembros;
          break;
        case 'pastores':
          filtrados = miembros.filter((m) => m.rol === 'pastor');
          break;
        case 'administradores':
          filtrados = miembros.filter((m) => m.rol === 'administrador');
          break;
        case 'lideres':
          filtrados = miembros.filter((m) => m.rol === 'lider');
          break;
        case 'servidores':
          filtrados = miembros.filter((m) => m.rol === 'servidor');
          break;
        case 'asistentes':
          filtrados = asistentes;
          break;
        case 'jovenes':
          filtrados = asistentes.filter((m) => m.categoria === 'Jovenes');
          break;
        case 'mujeres':
          filtrados = asistentes.filter((m) => m.categoria === 'Mujeres');
          break;
        case 'hombres':
          filtrados = asistentes.filter((m) => m.categoria === 'Hombres');
          break;
        default:
          console.warn(`Categoría desconocida: ${categoria}`);
          continue;
      }

      destinatarios.push(...filtrados);
    }

    // Eliminar duplicados por id
    const destinatariosUnicos = destinatarios.filter(
      (m, index, self) => index === self.findIndex((u) => u.id === m.id),
    );

    // Guardar un mensaje por cada destinatario
    for (const miembro of destinatariosUnicos) {
      if (!miembro.telefono.startsWith('57')) {
        miembro.telefono = '57' + miembro.telefono;
      }
      await this.guardarMensaje(
        miembro.telefono,
        mensajeDto.contenido,
        'sistema',
      );
    }

    return { total: destinatariosUnicos.length };
  }

  async obtenerMensajes() {
    return this.mensasRepository.find();
  }

  async obtenerPendientes() {
    return this.mensasRepository.find({ where: { enviado: false } });
  }

  async marcarComoEnviado(id: number) {
    return this.mensasRepository.update(id, { enviado: true });
  }
}
