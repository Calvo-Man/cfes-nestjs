// src/asistencias/asistencias-notificacion.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { CasasDeFe } from '../casas-de-fe/entities/casas-de-fe.entity';
import { Asistencia } from './entities/asistencia.entity';
import { OpenRouteService } from 'src/geolocalizacion/openroute.service';
import { AsistenciasService } from './asistencias.service';
import { GeocodingService } from 'src/geolocalizacion/geocoding.service';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AsistenciasNotificacionService {
  private readonly logger = new Logger(AsistenciasNotificacionService.name);

  constructor(
    @InjectRepository(Asistencia)
    private readonly usuarioRepository: Repository<Asistencia>,
    @InjectRepository(CasasDeFe)
    private readonly casasDeFeRepository: Repository<CasasDeFe>,
    private readonly asistenciasService: AsistenciasService,
    private readonly openRouteService: OpenRouteService,
    private readonly geocodingService: GeocodingService,
    private readonly whatsappService: ManejoDeMensajesService,
  ) {}

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

 @Cron('* * * * *') // Ejemplo: todos los días a las 8 am
  async notificarEncargadosConUsuariosCercanos() {
     const usuarios = await this.usuarioRepository.find({
      where: { direccion: Not(IsNull()), mensaje_enviado: false },
    });
    if (usuarios.length === 0) {
      this.logger.warn('❌ No se encontraron asistencias pendientes');
      return;
    }
    const casas = await this.casasDeFeRepository.find({ relations: ['encargadosId'] });

    if (casas.length === 0) {
      this.logger.warn('❌ No se encontraron casas de fe');
      return;
    }

    const mapaUsuariosPorCasa: Record<number, Asistencia[]> = {};
    for (const usuario of usuarios) {
      
      try {
        await this.sleep(1000);
        this.logger.debug(`Procesando ${usuario.nombre}`);
        await this.asistenciasService.MensajeEnviado(usuario.id);

        // const coords = await this.geocodingService.obtenerCoordenadas(usuario.direccion);
        // this.logger.debug('Coordenadas obtenidas', coords);

        // Filtrar casas por categoría compatible
        const casasCompatibles = casas.filter((casa) =>
          casa.categoria.includes(usuario.categoria),
        );

        if (casasCompatibles.length === 0) {
          this.logger.warn(`❌ No se encontró casa compatible para ${usuario.nombre} (${usuario.categoria})`);
          continue;
        }

        let casaMasCercana: CasasDeFe | null = null;
        let menorDistancia = Infinity;

        for (const casa of casasCompatibles) {
          const distancia = await this.openRouteService.calcularRuta(
            [usuario.longitud, usuario.latitud],
            [casa.longitud, casa.latitud],
          );

          if (distancia < menorDistancia) {
            menorDistancia = distancia;
            casaMasCercana = casa;
          }

          this.logger.debug(`Distancia a ${casa.nombre}: ${distancia}`);
        }

        if (casaMasCercana) {
  mapaUsuariosPorCasa[casaMasCercana.id] ||= [];
  mapaUsuariosPorCasa[casaMasCercana.id].push({
    ...usuario,
    distancia: Math.round(menorDistancia), // guarda la distancia en metros (redondeada)
  });
  await this.asistenciasService.asignarCasaDeFe(usuario.id, casaMasCercana);
}

      } catch (err) {
        this.logger.warn(`❌ Fallo al procesar ${usuario.nombre}: ${err.message}`);
      }
    }

    // 🔔 Notificar a encargados
    for (const [casaId, usuariosAsignados] of Object.entries(mapaUsuariosPorCasa)) {
      const casa = casas.find((c) => c.id === Number(casaId));
      if (!casa) continue;

      for (const encargado of casa.encargadosId) {
        const mensaje = `*Notificación de asistencias cercanas*
*Nota:* Este mensaje es automático y la IA no tiene contexto sobre el contenido.

Hola ${encargado.name} ${encargado.apellido}, ¡esperamos que estés muy bien!

Recientemente, nuevos *${casa.categoria}* asistieron a la iglesia o eventos y viven cerca de tu casa de fe *${casa.nombre}*.

Estas son las personas cercanas:
${usuariosAsignados
  .map(
    (u, i) =>
      `* ${i + 1}. ${u.nombre} ${u.apellido} - ${u.direccion} - Telefono: ${u.telefono} - distancia: ${u.distancia} mts`,
  )
  .join('\n')}

Te animamos a darles la bienvenida e invitarlas a participar activamente. ¡Gracias por tu compromiso y servicio!`;

        await this.whatsappService.guardarMensaje(encargado.telefono, mensaje);
      }
    }
  }
}
