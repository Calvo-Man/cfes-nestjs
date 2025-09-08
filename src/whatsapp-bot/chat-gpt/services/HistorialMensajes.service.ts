import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { HistorialMensajes } from '../entities/historialMensajes.entity';

@Injectable()
export class HistorialMensajesService {
  constructor(
    @InjectRepository(HistorialMensajes)
    private readonly historialRepo: Repository<HistorialMensajes>,
  ) {}

  private readonly LIMITE_CONSERVAR = 100; // mensajes
  private readonly LIMITE_RETORNO = 50;

async agregarMensaje(
  telefono: string,
  rol: 'user' | 'assistant' | 'tool' | 'system',
  contenido: string,
  toolCallId?: string,
  toolCalls?: { id: string; name: string; arguments: string }[],
): Promise<HistorialMensajes> {
  if (rol === 'system') {
    const existente = await this.historialRepo.findOne({
      where: { telefono, rol: 'system' },
    });

    if (existente) {
      existente.contenido = contenido;
      return this.historialRepo.save(existente);
    }

    return this.historialRepo.save(
      this.historialRepo.create({ telefono, rol, contenido }),
    );
  }

  // 🟢 Ajuste importante:
  // - Si es `assistant` con toolCalls → se guarda el array en `toolCalls`
  // - Si es `tool` → se guarda el `toolCallId` con su resultado
  // - Si es normal (user/assistant sin tools) → se guarda como siempre
  const nuevo = this.historialRepo.create({
    telefono,
    rol,
    contenido,
    toolCallId: toolCallId ?? null,
    toolCalls: toolCalls ?? null,
  });

  await this.historialRepo.save(nuevo);
  console.log(`🔹 Mensaje agregado al historial (${telefono} - ${rol}): ${contenido}`);

  // 🔹 Limitar tamaño del historial
  // const mensajes = await this.historialRepo.find({
  //   where: { telefono, rol: Not('system') as any },
  //   order: { id: 'DESC' },
  // });

  // if (mensajes.length > this.LIMITE_CONSERVAR) {
  //   const mensajesConservar = mensajes.slice(0, this.LIMITE_CONSERVAR - 50); // siempre conservar los más recientes

  //   // 🔑 Mantener bloque de toolCalls (assistant + tool responses asociadas)
  //   const ultimoTool = mensajes.find((m) => m.toolCallId);
  //   if (ultimoTool) {
  //     const relacionados = mensajes.filter(
  //       (m) =>
  //         m.toolCallId === ultimoTool.toolCallId ||
  //         (ultimoTool.toolCalls ?? []).some((tc) => tc.id === m.toolCallId),
  //     );

  //     for (const r of relacionados) {
  //       if (!mensajesConservar.find((mc) => mc.id === r.id)) {
  //         mensajesConservar.push(r);
  //       }
  //     }
  //   }

  //   const idsConservar = mensajesConservar.map((m) => m.id);
  //   const idsEliminar = mensajes
  //     .filter((m) => !idsConservar.includes(m.id))
  //     .map((m) => m.id);

  //   if (idsEliminar.length) {
  //     await this.historialRepo.delete(idsEliminar);
  //   }
  // }

  return nuevo;
}


  async obtenerHistorial(telefono: string): Promise<HistorialMensajes[]> {
    const [system, otros] = await Promise.all([
      this.historialRepo.findOne({ where: { telefono, rol: 'system' } }),
      this.historialRepo.find({
        where: { telefono, rol: Not('system') as any },
        order: { id: 'ASC' },
        take: this.LIMITE_RETORNO,
      }),
    ]);

    return system ? [system, ...otros] : otros;
  }

  async actualizarSystemPrompt(
    telefono: string,
    contenido: string,
  ): Promise<HistorialMensajes> {
    let existente = await this.historialRepo.findOne({
      where: { telefono, rol: 'system' },
    });

    if (existente) {
      existente.contenido = contenido;
      return this.historialRepo.save(existente);
    }

    // Si no existe un system prompt previo, lo crea
    const nuevo = this.historialRepo.create({
      telefono,
      rol: 'system',
      contenido,
    });

    return await this.historialRepo.save(nuevo);
  }
  async eliminarHistorial(telefono: string) {
    try {
      await this.historialRepo.delete({ telefono });
      return 'Historial eliminado exitosamente.';
    } catch (error) {
      console.error(`Error eliminando historial para ${telefono}:`, error);
      throw new Error('No se pudo eliminar el historial de mensajes.');
    }
  }
}
