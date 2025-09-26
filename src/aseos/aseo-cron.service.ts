import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AseosService } from 'src/aseos/aseos.service';
import { MiembrosService } from 'src/miembros/miembros.service';
import dayjs from 'dayjs';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { AseoGateway } from './aseo.gateway';
import { Horario } from 'src/miembros/enum/horario.enum';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import 'dayjs/locale/es';

dayjs.locale('es');

@Injectable()
export class AseoCronService {
  private readonly logger = new Logger(AseoCronService.name);

  constructor(
    private readonly miembroService: MiembrosService,
    private readonly aseoService: AseosService,
    private readonly aseoGateway: AseoGateway,
    private readonly manejoDeMensajesService: ManejoDeMensajesService,
  ) {}

 // Cada día 26 del mes a las 00:00
  @Cron('20 6 26 * *')
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

    // 👉 Generar asignaciones y guardarlas
    const asignaciones = await this.generarAsignacionesMensuales();

    // 👉 Notificar asignaciones
    await this.notificarAsignaciones(asignaciones);

    this.aseoGateway.notificarNuevoHorario();
  }

  /**
   * Genera y guarda las asignaciones en DB
   */
  async generarAsignacionesMensuales(): Promise<
    { miembro: Miembro; fecha: Date }[]
  > {
    const miembros = await this.miembroService.findAllMembers();
    const fechas = this.obtenerDiasJuevesYDomingoDelProximoMes();

    const domingos = fechas.filter((f) => dayjs(f).day() === 0);
    const jueves = fechas.filter((f) => dayjs(f).day() === 4);

    let asignaciones: { miembro: Miembro; fecha: Date }[] = [];
    const asignacionesPorFecha: Record<string, Miembro[]> = {};
    const asignacionesPorMiembro: Record<number, number> = {};
    const resumenDiasIncompletos: string[] = [];

    // 🛠 Función asignar centralizada
    const asignar = (miembro: Miembro, fecha: Date) => {
      this.logger.log(
        `🛠 Asignando ${miembro.name.trim()} ${miembro.apellido.trim()} para el ${dayjs(fecha).format('dddd DD [de] MMMM [de] YYYY')}...`,
      );
      const key = fecha.toISOString();

      // Inicializar si no existen aún
      if (!asignacionesPorFecha[key]) {
        asignacionesPorFecha[key] = [];
      }
      if (!asignacionesPorMiembro[miembro.id]) {
        asignacionesPorMiembro[miembro.id] = 0;
      }
      this.logger.log(
        `asignaciones Por Miembro[${miembro.id}]: ${asignacionesPorMiembro[miembro.id]}`,
      );
      this.logger.log(
        `✅ Asignaciones por fecha: ${asignacionesPorFecha[key]}.`,
      );

      // 🚫 Evitar asignar al mismo miembro más de una vez el mismo día
      const yaAsignado = asignacionesPorFecha[key].some(
        (m) => m.id === miembro.id,
      );
      this.logger.log(`yaAsignado: ${yaAsignado}`);
      if (yaAsignado) return false;

      // 🚫 Evitar que pase de 2 asignaciones en el mes
      if (asignacionesPorMiembro[miembro.id] >= 2) return false;

      // ✅ Registrar asignación
      asignacionesPorFecha[key].push(miembro);
      asignacionesPorMiembro[miembro.id]++;
      asignaciones.push({ miembro, fecha });

      return true; // indica que se asignó exitosamente
    };

    const todosLosDias = [...domingos, ...jueves];
    // Antes del paso 1
    const asignadosPaso1 = new Set<number>(); // ids de miembros asignados en paso 1
    // Paso 1: Asignar 1 por día según disponibilidad
    for (const fecha of todosLosDias) {
      const key = fecha.toISOString();
      const dia = dayjs(fecha).day();
      const minimo = dia === 0 ? 3 : 2;

      const compatibles = this.mezclarArray(
        miembros.filter((m) => {
          const asignacionesTotales = asignacionesPorMiembro[m.id] || 0;

          // 1. Ya llegó al límite mensual
          if (asignacionesTotales >= 1) return false;

          // 2. Ya está asignado en esta misma fecha
          if (asignacionesPorFecha[key]?.some((x) => x.id === m.id))
            return false;

          // 3. Verificar disponibilidad según el día
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
      const elegido =
        compatibles[Math.floor(Math.random() * compatibles.length)];

      if (elegido) {
        const resultado = asignar(elegido, fecha);
        this.logger.log(`Resultado de asignación: ${resultado}.`);
        if (resultado) {
          asignadosPaso1.add(elegido.id); // ✅ marcar como ya asignado en paso 1
        }
      } else {
        this.logger.warn(
          `⚠️ No se encontró ningún miembro compatible para el ${dayjs(fecha).format('dddd DD/MM/YYYY')}`,
        );
      }
      const StepTwoCount = asignacionesPorFecha[key]?.length || 0;
      if (StepTwoCount < minimo) {
        resumenDiasIncompletos.push(
          `❌ El ${dayjs(fecha).format('dddd DD/MM/YYYY')} no pudo ser completado en el paso 1. Solo ${StepTwoCount}/${minimo} asignados.`,
        );
      }
    }

    // Paso 2: Completar los días con el mínimo requerido
    for (const fecha of todosLosDias) {
      const key = fecha.toISOString();
      const dia = dayjs(fecha).day();
      const minimo = dia === 0 ? 3 : 2;
      const asignados = asignacionesPorFecha[key]?.length || 0;
      if (asignados >= minimo) continue;

      let faltan = minimo - asignados;

      // ⚡ Solo miembros que NO fueron asignados en el paso 1
      const compatibles = this.mezclarArray(
        miembros.filter((m) => {
          if (asignadosPaso1.has(m.id)) return false;
          const asignacionesTotales = asignacionesPorMiembro[m.id] || 0;
          if (asignacionesTotales >= 1) return false;
          if (asignacionesPorFecha[key]?.some((a) => a.id === m.id))
            return false;

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

      // Asignar hasta cumplir el mínimo
      for (const miembro of compatibles) {
        if (faltan <= 0) break;
        asignar(miembro, fecha);
        asignadosPaso1.add(miembro.id); // ✅ marcar como ya asignado en paso 1
        this.logger.log(
          `Miembro ${miembro.name} ${miembro.apellido} asignado.`,
        );
        faltan--;
      }

      const StepTwoCount = asignacionesPorFecha[key]?.length || 0;
      if (StepTwoCount < minimo) {
        resumenDiasIncompletos.push(
          `❌ El ${dayjs(fecha).format('dddd DD/MM/YYYY')} no pudo ser completado en el paso 2. Solo ${StepTwoCount}/${minimo} asignados.`,
        );
      }
    }
    // Paso 3: Reasignación con intercambios
    // Paso 3: Completar días incompletos
    for (const [fecha, asignacionesDia] of Object.entries(
      asignacionesPorFecha,
    )) {
      const diaSemana = new Date(fecha).getDay();
      const minimo = diaSemana === 0 ? 3 : 2; // domingos = 0 → 3 personas, jueves = 4 → 2 personas

      if (asignacionesDia.length < minimo) {
        const faltantes = minimo - asignacionesDia.length;

        for (let i = 0; i < faltantes; i++) {
          // 1. Buscar primero personas SIN asignaciones y con disponibilidad exacta
          const candidatosSinAsignacion = miembros.filter(
            (m) =>
              !asignaciones.some((a) => a.miembro.id === m.id) &&
              (m.horario_aseo === Horario.ANY ||
                (m.horario_aseo === Horario.DOMINGO && diaSemana === 0) ||
                (m.horario_aseo === Horario.JUEVES && diaSemana === 4)),
          );

          if (candidatosSinAsignacion.length > 0) {
            const elegido = this.mezclarArray(candidatosSinAsignacion)[0];
            asignaciones.push({ miembro: elegido, fecha: new Date(fecha) });
            asignacionesDia.push(elegido);
            continue;
          }

          // 2. Si no hay, entonces buscar un miembro con ANY ya asignado en otro día compatible
          const posiblesIntercambios = asignaciones.filter(
            (a) =>
              a.miembro.horario_aseo === Horario.ANY &&
              a.fecha.getDay() !== diaSemana, // distinto día
          );

          if (posiblesIntercambios.length > 0) {
            const victima = this.mezclarArray(posiblesIntercambios)[0];

            // Buscar una persona que coincida con el día original de la víctima
            const candidatosParaVictima = miembros.filter(
              (m) =>
                !asignaciones.some((a) => a.miembro.id === m.id) && // que no esté asignado
                ((victima.fecha.getDay() === 0 &&
                  m.horario_aseo === Horario.DOMINGO) ||
                  (victima.fecha.getDay() === 4 &&
                    m.horario_aseo === Horario.JUEVES)),
            );

            if (candidatosParaVictima.length > 0) {
              // Sacamos a la víctima de su día
              asignacionesPorFecha[victima.fecha.toISOString()] =
                asignacionesPorFecha[victima.fecha.toISOString()].filter(
                  (a) => a.id !== victima.miembro.id,
                );
              asignaciones = asignaciones.filter((a) => a !== victima);

              // Ponemos a la víctima en el día incompleto
              asignaciones.push({
                miembro: victima.miembro,
                fecha: new Date(fecha),
              });
              asignacionesDia.push(victima.miembro);

              // Ponemos a un reemplazo en el día de la víctima
              const reemplazo = this.mezclarArray(candidatosParaVictima)[0];
              asignaciones.push({ miembro: reemplazo, fecha: victima.fecha });
              asignacionesPorFecha[victima.fecha.toISOString()].push(reemplazo);
            }
          }
        }
      }
    }

    // Paso 4: Tercer criterio: Verificar quien se le hizo un intercambio y reasignarlo
    for (const fecha of todosLosDias) {
      const key = fecha.toISOString();
      const dia = dayjs(fecha).day();
      const minimo = dia === 0 ? 3 : 2;
      const asignados = asignacionesPorFecha[key]?.length || 0;
      if (asignados >= minimo) continue;

      let faltan = minimo - asignados;

      // ⚡ Candidatos: miembros que aún no tienen asignaciones
      const compatibles = this.mezclarArray(
        miembros.filter((m) => {
          if (asignadosPaso1.has(m.id)) return false;
          const asignacionesTotales = asignacionesPorMiembro[m.id] || 0;
          if (asignacionesTotales >= 1) return false; // 🚫 máximo 2 en el mes

          if (asignacionesPorFecha[key]?.some((a) => a.id === m.id))
            return false; // 🚫 evitar duplicado el mismo día

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

      const StepFourCount = asignacionesPorFecha[key]?.length || 0;
      if (StepFourCount < minimo) {
        resumenDiasIncompletos.push(
          `❌ El ${dayjs(fecha).format('dddd DD/MM/YYYY')} quedó incompleto incluso tras el Paso 4. Solo ${StepFourCount}/${minimo} asignados.`,
        );
      }
    }
    // Paso 5: Asignar segundo aseo si no se pudo completar el minimo en las pasos anteriores
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
          if (asignacionesPorFecha[key]?.some((a) => a.id === m.id))
            return false;

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

      // Asignar hasta cumplir el mínimo
      for (const miembro of compatibles) {
        if (faltan <= 0) break;
        asignar(miembro, fecha);
        this.logger.warn(
          `Miembro ${miembro.name} ${miembro.apellido} asignado.`,
        );
        faltan--;
      }

      const StepTwoCount = asignacionesPorFecha[key]?.length || 0;
      if (StepTwoCount < minimo) {
        resumenDiasIncompletos.push(
          `❌ El ${dayjs(fecha).format('dddd DD/MM/YYYY')} no pudo ser completado en el paso 5. Solo ${StepTwoCount}/${minimo} asignados.`,
        );
      }
    }

    // Paso 6: Guardar asignaciones en DB
    for (const { miembro, fecha } of asignaciones) {
      const yaExiste = await this.aseoService.existeAsignacionEnFecha(
        miembro.id,
        fecha,
      );
      if (yaExiste) continue;
      await this.aseoService.create({
        miembroId: miembro.id,
        fecha: fecha.toISOString(),
      });
    }

    if (resumenDiasIncompletos.length > 0) {
      this.logger.warn('⚠️ Días con asignaciones incompletas:');
      resumenDiasIncompletos.forEach((msg) => this.logger.warn(msg));
    }

    this.logger.log(
      `✅ Se generaron ${asignaciones.length} asignaciones de aseo.`,
    );
    this.logger.log(`✅ Se generaron ${asignaciones} asignaciones de aseo.`);
    return asignaciones;
  }

  /**
   * Notifica a los miembros sus asignaciones por WhatsApp
   */
  async notificarAsignaciones(
    asignaciones: { miembro: Miembro; fecha: Date }[],
  ) {
    for (const { miembro, fecha } of asignaciones) {
      if (!this.verificarNumeroDeTelefono(miembro.telefono)) {
        this.logger.warn(
          `🚫 Teléfono inválido para ${miembro.name} ${miembro.apellido}: ${miembro.telefono}`,
        );
        continue;
      }

      const helpers = asignaciones.filter(
        (a) => a.fecha.getTime() === fecha.getTime(),
      );
      const otros = helpers
        .map((h) => h.miembro)
        .filter((m) => m.id !== miembro.id);

      const mensaje = `*Notificacion de calendario de aseo*
*Nota:* Este mensaje es automático y la IA no tiene contexto sobre el contenido.

Hola estimado/a *${miembro.name.trim()}*,
Se ha creado el horario de aseo para el mes de *${dayjs(fecha).format('MMMM [de] YYYY')}*.
Su dia de aseo de preferencia es *${miembro.horario_aseo}*.
Fuiste asignado el dia *${dayjs(fecha).format('dddd DD [de] MMMM [de] YYYY')}*.
Los encargados del aseo contigo son: 
${otros.map((m) => `* *${m.name.trim()} ${m.apellido.trim()}*`).join('\n') || '*Ninguno (No hay suficientes miembros disponibles)*'}.

Gracias por tu colaboracion.
> Centro de fe y esperanza San Pelayo.
`;

      await this.manejoDeMensajesService.guardarMensaje(
        miembro.telefono,
        mensaje,
        'Sistema',
      );
      this.logger.log(
        `📲 Notificado ${miembro.name} el ${dayjs(fecha).format('DD/MM/YYYY')}`,
      );
    }
  }

 verificarNumeroDeTelefono(telefono: string): boolean {
    const telefonoRegex = /^57\d{10}}$/; // 👈 corregido a 57 + 10 dígitos
    return true;
  }

  obtenerDiasJuevesYDomingoDelProximoMes(): Date[] {
    const fechas: Date[] = [];
    const inicio = dayjs().add(1, 'month').startOf('month');
    const fin = dayjs().add(1, 'month').endOf('month');

    for (let fecha = inicio; fecha.isBefore(fin); fecha = fecha.add(1, 'day')) {
      const dia = fecha.day();
      if (dia === 0 || dia === 4) fechas.push(fecha.toDate());
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
