import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AseosService } from 'src/aseos/aseos.service';
import { MiembrosService } from 'src/miembros/miembros.service';
import dayjs from 'dayjs';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { AseoGateway } from './aseo.gateway';
import { Horario } from 'src/miembros/enum/horario.enum';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import 'dayjs/locale/es'; // 👈 importa el idioma español
dayjs.locale('es'); // 👈 establece español como idioma global

@Injectable()
export class AseoCronService {
  private readonly logger = new Logger(AseoCronService.name);

  constructor(
    private readonly miembroService: MiembrosService,
    private readonly aseoService: AseosService,
    private readonly aseoGateway: AseoGateway,
    private readonly manejoDeMensajesService: ManejoDeMensajesService,
  ) {}

  //Cron cada segundo
  
//@Cron('* * * * *')
  async generarHorarioMensualDeAseo() {
    this.logger.log('🧹 Generando horario de aseo mensual...');
    const inicioMesProximo = dayjs().add(1, 'month').startOf('month');
    const yaExiste = await this.aseoService.existeAseoParaMes(
      inicioMesProximo.year(),
      inicioMesProximo.month() + 1,
    );
    if (yaExiste) {
      this.logger.log('🧹 Ya existe un horario de aseo para el próximo mes.');
      return;
    }

    const miembros = await this.miembroService.findAllMembers();
    const fechas = this.obtenerDiasJuevesYDomingoDelProximoMes();

    const domingos = fechas.filter((f) => dayjs(f).day() === 0);
    const jueves = fechas.filter((f) => dayjs(f).day() === 4);

    const miembrosUsados = new Set<number>();
    const asignaciones: { miembro: Miembro; fecha: Date }[] = [];
    const asignacionesPorFecha: Record<string, Miembro[]> = {};
    const asignacionesPorMiembro: Record<number, number> = {};
    const resumenDiasIncompletos: string[] = [];

    const asignar = (miembro: Miembro, fecha: Date) => {
      const key = fecha.toISOString();
      if (!asignacionesPorFecha[key]) asignacionesPorFecha[key] = [];
      asignaciones.push({ miembro, fecha });
      asignacionesPorFecha[key].push(miembro);
      miembrosUsados.add(miembro.id);
      asignacionesPorMiembro[miembro.id] =
        (asignacionesPorMiembro[miembro.id] || 0) + 1;
    };

    const todosLosDias = [...domingos, ...jueves];

    // Paso 1: Asignar 1 por día según disponibilidad
    for (const fecha of todosLosDias) {
      const dia = dayjs(fecha).day();
      const compatibles = this.mezclarArray(
        miembros.filter((m) => {
          const asignacionesTotales = asignacionesPorMiembro[m.id] || 0;
          if (asignacionesTotales >= 2) return false;
          if (
            dia === 0 &&
            (m.horario_aseo === Horario.DOMINGO ||
              m.horario_aseo === Horario.ANY)
          )
            return true;
          if (
            dia === 4 &&
            (m.horario_aseo === Horario.JUEVES ||
              m.horario_aseo === Horario.ANY)
          )
            return true;
          return false;
        }),
      );

      if (compatibles.length > 0) asignar(compatibles[0], fecha);
    }

    // Paso 2: Completar los días con el mínimo requerido
    for (const fecha of todosLosDias) {
      const key = fecha.toISOString();
      const dia = dayjs(fecha).day();
      const minimo = dia === 0 ? 3 : 2;
      const asignados = asignacionesPorFecha[key]?.length || 0;
      if (asignados >= minimo) continue;

      let faltan = minimo - asignados;

      const compatibles = this.mezclarArray(
        miembros.filter((m) => {
          const asignacionesTotales = asignacionesPorMiembro[m.id] || 0;
          if (asignacionesTotales >= 2) return false;
          if (
            dia === 0 &&
            (m.horario_aseo === Horario.DOMINGO ||
              m.horario_aseo === Horario.ANY)
          )
            return true;
          if (
            dia === 4 &&
            (m.horario_aseo === Horario.JUEVES ||
              m.horario_aseo === Horario.ANY)
          )
            return true;
          return false;
        }),
      );

      for (const miembro of compatibles) {
        if (faltan <= 0) break;
        asignar(miembro, fecha);
        faltan--;
      }

      const finalCount = asignacionesPorFecha[key]?.length || 0;
      if (finalCount < minimo) {
        resumenDiasIncompletos.push(
          `❌ El ${dayjs(fecha).format('dddd DD/MM/YYYY')} no pudo ser completado. Solo ${finalCount}/${minimo} asignados.`,
        );
      }
    }

    // Paso 3: Guardar asignaciones
    let miembrosAsignados = 0;
    const miembrosNotificados = new Set<number>();
    for (const { miembro, fecha } of asignaciones) {
      const yaExiste = await this.aseoService.existeAsignacionEnFecha(
        miembro.id,
        fecha,
      );
      if (yaExiste) {
        this.logger.warn(
          `🚫 Ya existe asignación para ${miembro.name} ${miembro.apellido} el ${dayjs(fecha).format('DD/MM/YYYY')}`,
        );
        continue;
      }

      await this.aseoService.create({
        miembroId: miembro.id,
        fecha: fecha.toISOString(),
      });
      if (!this.verificarNumeroDeTelefono(miembro.telefono)) {
        this.logger.warn(
          `🚫 Miembro ${miembro.name} ${miembro.apellido} no tiene un telefono valido: ${miembro.telefono}`,
        );
        continue;
      }
      // 👇 Armar mensaje para el miembro
      const helpers = asignacionesPorFecha[fecha.toISOString()] || [];
      const otros = helpers.filter((m) => m.id !== miembro.id);
      const mensaje = `*Notificacion de calendario de aseo*
*Nota:* Este mensaje es automático y la IA no tiene contexto sobre el contenido.

Hola estimado/a *${miembro.name}*,
Se ha creado el horario de aseo para el mes de *${dayjs(fecha).format('MMMM [de] YYYY')}*.
Fuiste asignado el dia *${dayjs(fecha).format('dddd DD [de] MMMM [de] YYYY')}*.
Los encargados del aseo contigo son: 
${otros.map((m) => `* *${m.name} ${m.apellido}*`).join('\n') || '*Ninguno (No hay suficientes miembros disponibles)*'}.

Gracias por tu colaboracion.
> Centro de fe y esperanza San Pelayo.
`;

      if (this.verificarNumeroDeTelefono(miembro.telefono)) {
        await this.manejoDeMensajesService.guardarMensaje(
          miembro.telefono,
          mensaje,
          'Sistema',
        );
      }
      this.logger.log(
        `✅ Asignado ${miembro.name} el ${dayjs(fecha).format('DD/MM/YYYY')}`,
      );
      miembrosAsignados++;
    }

    this.logger.log(
      `✅ Se generaron ${miembrosAsignados} asignaciones de aseo.`,
    );

    if (resumenDiasIncompletos.length > 0) {
      this.logger.warn('⚠️ Días con asignaciones incompletas:');
      resumenDiasIncompletos.forEach((msg) => this.logger.warn(msg));
    }

    this.aseoGateway.notificarNuevoHorario();
  }
  verificarNumeroDeTelefono(telefono: string): boolean {
    const telefonoRegex = /^57[0-9]{10}$/;
    return telefonoRegex.test(telefono);
  }

  obtenerDiasJuevesYDomingoDelProximoMes(): Date[] {
    const fechas: Date[] = [];
    const inicio = dayjs().add(1, 'month').startOf('month');
    const fin = dayjs().add(1, 'month').endOf('month');

    for (let fecha = inicio; fecha.isBefore(fin); fecha = fecha.add(1, 'day')) {
      const dia = fecha.day(); // 0 = domingo, 4 = jueves
      if (dia === 0 || dia === 4) {
        fechas.push(fecha.toDate());
      }
    }

    return fechas;
  }

  mezclarArray<T>(array: T[]): T[] {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }
}
