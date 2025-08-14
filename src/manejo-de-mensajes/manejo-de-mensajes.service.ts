// src/mensajes-pendientes/mensajes-pendientes.service.ts
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensajes } from './entities/manejo-de-mensaje.entity';
import { MiembrosService } from 'src/miembros/miembros.service';
import { CreateManejoDeMensajeDto } from './dto/create-manejo-de-mensaje.dto';
import { AsistenciasService } from 'src/asistencias/asistencias.service';

@Injectable()
export class ManejoDeMensajesService {
  constructor(
    @InjectRepository(Mensajes)
    private mensasRepository: Repository<Mensajes>,
    @Inject(forwardRef(() => MiembrosService))
    private miembrosService: MiembrosService,
    private readonly asistenciasService: AsistenciasService
  ) {}

  async guardarMensaje(telefono: string, contenido: string, enviar_por: string) {
    const mensaje = this.mensasRepository.create({ telefono, contenido, enviar_por });
    return this.mensasRepository.save(mensaje);
  }
  // Método para guardar varios mensajes:Lideres,servidores o asistentes
  // Este método recibe un array de categorias y guarda un mensaje para cada uno.
  async guardarVariosMensajes(mensajeDto: CreateManejoDeMensajeDto) {
  const { miembros } = await this.miembrosService.getMiembros();
  const asistentes = await this.asistenciasService.findAll();

  // Array para acumular los destinatarios
  let destinatarios: any[] = [];

  for (const categoria of mensajeDto.enviado_a) {
    let filtrados: any[] = [];

    switch (categoria) {
      case 'lideres':
        filtrados = miembros.filter(m => m.rol === 'lider');
        break;
      case 'servidores':
        filtrados = miembros.filter(m => m.rol === 'servidor');
        break;
      case 'asistentes':
        filtrados = asistentes;
        break;
      default:
        console.warn(`Categoría desconocida: ${categoria}`);
        continue;
    }

    destinatarios.push(...filtrados);
  }

  // Eliminar duplicados por id
  const destinatariosUnicos = destinatarios.filter(
    (m, index, self) => index === self.findIndex(u => u.id === m.id)
  );

  // Guardar un mensaje por cada destinatario
  for (const miembro of destinatariosUnicos) {
    await this.guardarMensaje(
      miembro.telefono,
      mensajeDto.contenido,
      'sistema'
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
