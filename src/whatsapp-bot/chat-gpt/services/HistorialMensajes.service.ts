import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { HistorialMensajes } from '../entities/historialMensajes.entity';
import { RedisService } from './redis-historial.service';

@Injectable()
export class HistorialMensajesService {
  private readonly logger = new Logger(HistorialMensajesService.name);
  private readonly TTL = Number(process.env.REDIS_TTL_CHAT ?? 86400); // seg
  private readonly LIMITE_CONSERVAR = 100; // en DB (si quieres purge)
  private readonly LIMITE_RETORNO = 50; // cuántos traer para contexto

  constructor(
    @InjectRepository(HistorialMensajes)
    private readonly historialRepo: Repository<HistorialMensajes>,
    private readonly redis: RedisService,
  ) {}

  // Guardar en DB y en Redis (lista)
  async agregarMensaje(
    telefono: string,
    rol: 'user' | 'assistant' | 'tool' | 'system',
    contenido: string,
    toolCallId?: string,
    toolCalls?: { id: string; name: string; arguments: string }[],
  ): Promise<HistorialMensajes> {
    // system prompt: actualización o creación en DB (no lo duplicamos en la lista)
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

    const nuevo = this.historialRepo.create({
      telefono,
      rol,
      contenido,
      toolCallId: toolCallId ?? null,
      toolCalls: toolCalls ?? null,
    });
    const saved = await this.historialRepo.save(nuevo);
    this.logger.log(
      `Mensaje guardado DB (${telefono} - ${rol}) id=${saved.id}`,
    );

    // Push a Redis (JSON string)
    const key = `historial:${telefono}`;
    const payload = JSON.stringify({
      id: saved.id,
      rol: saved.rol,
      contenido: saved.contenido,
      toolCallId: saved.toolCallId,
      toolCalls: saved.toolCalls,
      creadoEn: saved.creadoEn,
    });
    try {
      await this.redis.rpush(key, payload);
      await this.redis.expire(key, this.TTL);
    } catch (err) {
      this.logger.warn(`Redis no disponible: ${err.message}`);
    }

    return saved;
  }

  // Devuelve [system?, ...mensajes_activos]
  async obtenerHistorialActivo(telefono: string) {
    const key = `historial:${telefono}`;
    const enRedis = await this.redis.lrange(key, 0, -1); // todo el historial
    if (enRedis.length) return enRedis.map((s) => JSON.parse(s));

    // Fallback DB -> poblar lista incluyendo system
    const desdeDb = await this.historialRepo.find({
      where: { telefono },
      order: { id: 'ASC' },
      take: this.LIMITE_RETORNO,
    });

    if (desdeDb.length) {
      for (const m of desdeDb) {
        await this.redis.rpush(key, JSON.stringify(m));
      }
      await this.redis.expire(key, this.TTL);
    }

    return desdeDb;
  }

  async obtenerHistorialCompleto(telefono: string) {
    return this.historialRepo.find({
      where: { telefono },
      order: { creadoEn: 'ASC' },
    });
  }

  async eliminarHistorial(telefono: string) {
    await Promise.all([
      this.redis.del(`historial:${telefono}`),
      this.historialRepo.delete({ telefono }),
    ]);
    return 'Historial eliminado de Redis y MariaDB';
  }

  // Cuando ocurre un error para limpiar el último assistant (DB + Redis tail)
  async eliminarUltimoToolCall(telefono: string): Promise<void> {
    const ultimoAssistant = await this.historialRepo.findOne({
      where: { telefono, rol: 'assistant' },
      order: { id: 'DESC' },
    });

    if (!ultimoAssistant) return;

    // Eliminar de DB
    await this.historialRepo.remove(ultimoAssistant);

    // Si el último elemento en Redis coincide, rpop
    const key = `historial:${telefono}`;
    const last = await this.redis.lindex(key, -1);
    if (last) {
      try {
        const parsed = JSON.parse(last);
        if (parsed.id && parsed.id === ultimoAssistant.id) {
          await this.redis.rpop(key);
        }
      } catch (e) {
        // noop
      }
    }
  }
  // ✅ Actualiza o crea el mensaje de rol system
  async actualizarSystemPrompt(
    telefono: string,
    contenido: string,
  ): Promise<HistorialMensajes> {
    const key = `historial:${telefono}`;

    // 1) DB: crea o actualiza
    let registro = await this.historialRepo.findOne({
      where: { telefono, rol: 'system' },
    });

    if (registro) {
      registro.contenido = contenido;
      registro = await this.historialRepo.save(registro);
    } else {
      registro = await this.historialRepo.save(
        this.historialRepo.create({ telefono, rol: 'system', contenido }),
      );
    }

    // 2) Redis: coloca en el índice 0
    const payload = JSON.stringify({
      id: registro.id,
      rol: 'system',
      contenido: registro.contenido,
      creadoEn: registro.creadoEn,
    });

    const first = await this.redis.lindex(key, 0);
    if (first) {
      const parsed = JSON.parse(first);
      if (parsed.rol === 'system') {
        // sobrescribe si ya existe en 0
        await this.redis.lset(key, 0, payload);
      } else {
        // inserta en cabeza
        await this.redis.ltrim(key, 0, -1); // opcional, para asegurar orden
        await this.redis.client.lPush(key, payload);
      }
    } else {
      // lista vacía
      await this.redis.client.lPush(key, payload);
    }

    await this.redis.expire(key, this.TTL);

    return registro;
  }
}
