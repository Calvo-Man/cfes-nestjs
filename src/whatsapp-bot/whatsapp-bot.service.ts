import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { Server } from 'socket.io';
import { Interval } from '@nestjs/schedule';
import * as fs from 'fs-extra';
import axios from 'axios';

import { TranscripcionService } from './voice-to-text.service';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import { MiembrosService } from 'src/miembros/miembros.service';
import { ChatGptMcpRespuestasService } from './chat-gpt/chat-gpt-respuestas.service';
import { SystemMessagesService } from './chat-gpt/services/SystemMessages.service';
import { HistorialMensajesService } from './chat-gpt/services/HistorialMensajes.service';

@Injectable()
export class WhatsappBotService implements OnModuleInit {
  private client: Client;
  private io: Server;
  private readonly logger = new Logger(WhatsappBotService.name);
  private enviandoMensajes = false;
  private botReady: Promise<void>;
  private botReadyResolve: () => void;

  private readyTimeout: NodeJS.Timeout;
  private reintentos = 0;
  //private readonly maxReintentos = 3;
  private readonly sessionPath = './auth/session-cfe';
  // 👇 NUEVO: buffers por usuario
  private buffers = new Map<
    string,
    { mensajes: Message[]; timeout: NodeJS.Timeout | null }
  >();
  // En WhatsappBotService
  private partialBuffers = new Map<
    string,
    { texto: string; timer: NodeJS.Timeout | null }
  >();

  private RATE_LIMIT_MS = 1500; // ⏱️ cada 1.5 s máx un mensaje
  private MIN_CHARS = 40; // envía antes si hay >=40 caracteres

  private readonly DEBOUNCE_MS = 5000; // 4 s (puedes subir a 5000)
  constructor(
    public readonly manejoDeMensajesService: ManejoDeMensajesService,
    private readonly chatGptService: ChatGptMcpRespuestasService,
    private readonly transcripcionService: TranscripcionService,
    private readonly miembrosService: MiembrosService,
    private readonly systemMessagesService: SystemMessagesService,
    private readonly historialService: HistorialMensajesService,
  ) {}

  onModuleInit() {
    this.botReady = new Promise((resolve) => {
      this.botReadyResolve = resolve;
    });
    this.initializeBot();

    process.on('unhandledRejection', (reason) => {
      this.logger.error('⚠️ Unhandled Rejection en WhatsApp:', reason);
    });

    process.on('uncaughtException', (err) => {
      this.logger.error('🔥 Uncaught Exception:', err);
    });
  }

  private async initializeBot() {
    if (this.client) {
      this.client
        .destroy()
        .catch(() =>
          this.logger.warn('No se pudo destruir el cliente anterior.'),
        );
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'cfe-bot',
        dataPath: this.sessionPath,
      }),

      puppeteer: {
        headless: true,
        args: ['--disable-gpu', '--disable-dev-shm-usage'],
      },
    });

    this.client.on('qr', (qr) => {
      console.log('📲 Escanea este código QR con tu WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('authenticated', () => {
      this.logger.log('🔐 Cliente autenticado con éxito');
    });

    this.client.on('loading_screen', (percent, message) => {
      this.logger.log(`⌛ ${percent}% - ${message}`);
    });

    this.client.on('ready', () => {
      clearTimeout(this.readyTimeout);
      this.reintentos = 0;
      console.log('✅ Bot de WhatsApp listo para enviar mensajes.');
      this.botReadyResolve();
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Fallo de autenticación:', msg);
    });

    this.client.on('disconnected', async (reason) => {
      console.warn('⚠️ Cliente desconectado:', reason);
      try {
        await this.client.destroy();
      } catch (err) {
        console.error('❌ Error al destruir cliente:', err.message);
      }
      //this.reiniciarSesion();
    });

    // this.readyTimeout = setTimeout(() => {
    //   this.logger.warn('⚠️ Cliente no llegó a READY en el tiempo esperado.');
    //   this.reiniciarSesion();
    // }, 20000);

    this.client.on('message', async (message) => {
      const telefono = message.from.split('@')[0];

      // Ignorar mensajes de estado
      if (message.from.includes('status@broadcast')) return;

      // Agregar al buffer
      const buffer = this.buffers.get(telefono) || {
        mensajes: [],
        timeout: null,
      };
      buffer.mensajes.push(message);
      if (buffer.timeout) clearTimeout(buffer.timeout);

      buffer.timeout = setTimeout(
        () => this.procesarBuffer(telefono, buffer.mensajes),
        this.DEBOUNCE_MS,
      );

      this.buffers.set(telefono, buffer);
    });

    try {
      await this.client.initialize();
    } catch (err) {
      this.logger.error('❌ Error al inicializar cliente', err);
    }
  }
  setSocketServer(io: Server) {
    this.io = io;
  }
  // 👇 Nuevo método: procesa todos los mensajes acumulados del usuario
  private async procesarBuffer(telefono: string, mensajes: Message[]) {
  this.buffers.delete(telefono);
  const chat = await mensajes[0].getChat();

  const modoRespuesta = await this.miembrosService.obtenerModoRespuesta(telefono);
  if (modoRespuesta === 'texto') await chat.sendStateTyping();
  else await chat.sendStateRecording();

  const textos: string[] = [];

  for (const msg of mensajes) {
    if (msg.type === 'ptt') {
      const media = await msg.downloadMedia();
      if (!media) continue;
      const buffer = Buffer.from(media.data, 'base64');
      const t = await this.transcripcionService.transcribirDesdeBuffer(buffer);
      if (t && t !== 'No se pudo transcribir.') textos.push(t);
    } else if (msg.type === 'chat') {
      textos.push(msg.body);
    }
  }

  if (!textos.length) return;
  const prompt = textos.join('\n');

  let buffer = '';
let timer: NodeJS.Timeout | null = null;

  const flushBuffer = async () => {
    if (buffer.trim()) {
      await this.client.sendMessage(`${telefono}@c.us`, buffer.trim());
      this.logger.debug(`📤 Enviando a ${telefono}: ${buffer.trim()}`);
      buffer = '';
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };

  const scheduleFlush = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flushBuffer, 2000); // envía automáticamente cada 2 s si no hay punto final
  };
const start = Date.now();
  const respuesta = await this.chatGptService.responderPregunta(
    prompt,
    telefono,
    async (chunk) => {
     console.log('📤 Chunk recibido a', Date.now() - start, 'ms:', chunk);
      buffer += chunk;
      // Envía si termina frase o buffer largo
      if (/[.!?]\s$/.test(buffer) || buffer.length > 200) {
        await flushBuffer();
      } else {
        scheduleFlush();
      }
    },
  );

  // Enviar resto que quede en buffer
  await flushBuffer();

  // Si la IA produjo audio final
  if (respuesta.audioPath) {
    await this.enviarAudioComoRespuesta(telefono, respuesta.audioPath);
  }

  await chat.clearState();
}

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async delayRandom() {
    const min = 2000;
    const max = 6000;
    await this.delay(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  async enviarMensaje(numero: string, mensaje: string) {
    try {
      await this.botReady;
      if (!this.client || !this.client.info?.wid)
        throw new Error('Cliente de WhatsApp no está listo');

      let chatId = numero.includes('@c.us') ? numero : `${numero}@c.us`;
      chatId = numero.startsWith('57') ? chatId : `57${chatId}`;
      this.logger.debug(`📤 Enviando a ${chatId}: ${mensaje}`);

      const isRegistered = await this.client.isRegisteredUser(chatId);
      if (!isRegistered) throw new Error(`Número no registrado: ${numero}`);

      const chat = await this.client.getChatById(chatId).catch(() => null);
      await this.client.sendMessage(chatId, mensaje);
      await this.historialService.agregarMensaje(
        numero.split('@')[0],
        'assistant',
        mensaje,
      );
    } catch (err) {
      this.logger.warn(`❌ Error al enviar mensaje: ${err.message}`);
    }
  }

  async enviarAudioComoRespuesta(numero: string, rutaAudio: string) {
    const media = MessageMedia.fromFilePath(rutaAudio);
    await this.client.sendMessage(`${numero}@c.us`, media, {
      sendAudioAsVoice: true,
    });

    try {
      await fs.unlink(rutaAudio);
      console.log(`✅ Archivo de audio eliminado: ${rutaAudio}`);
    } catch (error) {
      console.error(`❌ Error al eliminar el archivo:`, error);
    }
  }

  @Interval(600000)
  async enviarMensajesPendientes() {
    if (this.enviandoMensajes) {
      this.logger.warn(
        '⚠️ Ya se está procesando una tanda de mensajes, se omite esta ejecución.',
      );
      return;
    }

    this.enviandoMensajes = true;

    try {
      await this.botReady;
      const mensajes = await this.manejoDeMensajesService.obtenerPendientes();
      if (!mensajes.length) {
        this.logger.debug('🕐 No hay mensajes pendientes');
        return;
      }

      for (const mensaje of mensajes) {
        if (mensaje.enviado) continue;
        await this.delayRandom();

        try {
          if (mensaje.enviar_por === 'Peticion') {
            const miembros = await this.miembrosService.getMiembros();
            for (const miembro of miembros.miembros) {
              if (
                miembro.rol === 'pastor' ||
                miembro.cargo === 'Intersección' ||
                miembro.telefono === '573024064896'
              ) {
                await this.enviarMensaje(miembro.telefono, mensaje.contenido);
              }
            }
          } else if (mensaje.enviar_por === 'IA') {
            const telefonoNumerico = mensaje.telefono.replace(/\D/g, '');
            const telefonoSinPrefijo = telefonoNumerico.startsWith('57')
              ? telefonoNumerico.slice(2)
              : telefonoNumerico;
            const respuesta =
              await this.systemMessagesService.recepcionarMensajesParaSistema(
                telefonoSinPrefijo,
                mensaje.contenido,
              );
            this.logger.debug(
              `📧 Enviando a IA ${mensaje.telefono}: ${mensaje.contenido}`,
            );
            await this.enviarMensaje(mensaje.telefono, respuesta.text);
          } else {
            await this.enviarMensaje(mensaje.telefono, mensaje.contenido);
          }

          await this.manejoDeMensajesService.marcarComoEnviado(mensaje.id);
          this.logger.debug(`✅ Mensaje enviado a ${mensaje.telefono}`);
        } catch (err) {
          this.logger.error(`❌ Error con ${mensaje.telefono}: ${err.message}`);
        }

        await this.delayRandom();
      }
    } catch (err) {
      this.logger.error('❌ Error en enviarMensajesPendientes:', err.message);
    } finally {
      this.enviandoMensajes = false;
    }
  }
}
