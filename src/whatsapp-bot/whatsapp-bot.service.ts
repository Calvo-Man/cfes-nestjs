import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { MessageMedia } from 'whatsapp-web.js';
import { createReadStream } from 'fs';
import * as qrcode from 'qrcode-terminal';
import { Server } from 'socket.io';
import { Interval } from '@nestjs/schedule';
import * as fs from 'fs-extra';

import { ChatGptRespuestasService } from './chat-gpt/respuesta-mensajes.service';
import { writeFile } from 'fs';
import { TranscripcionService } from './voice-to-text.service';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
@Injectable()
export class WhatsappBotService implements OnModuleInit {
  private client: Client;
  private io: Server;
  private readonly logger = new Logger(WhatsappBotService.name);
  private enviandoMensajes = false;
  private botReady: Promise<void>;
  private botReadyResolve: () => void;

  constructor(
    private readonly manejoDeMensajesService: ManejoDeMensajesService,
    private readonly respuestaMensajesService: ChatGptRespuestasService,
    private readonly transcripcionService: TranscripcionService,
  ) {}

  onModuleInit() {
    this.botReady = new Promise((resolve) => {
      this.botReadyResolve = resolve;
    });
    this.initializeBot();
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('⚠️ Unhandled Rejection en WhatsApp:', reason);
    });

    process.on('uncaughtException', (err) => {
      this.logger.error('🔥 Uncaught Exception:', err);
    });
  }

  private async initializeBot() {
    const wwebVersion = '2.2412.54';
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
        dataPath: './auth/session-cfe',
      }),

      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
        ],
      },
    });

    this.client.on('qr', (qr) => {
      console.log('📲 Escanea este código QR con tu WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('✅ Bot de WhatsApp listo para enviar mensajes.');
      this.botReadyResolve(); // señal que el bot está listo
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Fallo de autenticación:', msg);
      const path = './auth/session-cfe';
      if (fs.existsSync(path)) {
        fs.removeSync(path);
        console.log('🗑️ Carpeta de sesión eliminada');
      }
      this.initializeBot();
    });

    this.client.on('disconnected', async (reason) => {
      console.warn('⚠️ Cliente desconectado:', reason);
      try {
        await this.client.destroy();
      } catch (err) {
        console.error('❌ Error al destruir cliente:', err.message);
      }
      this.initializeBot();
    });

    this.client.on('message', async (message) => {
      const telefono = message.from.split('@')[0];
      if (
        message.from.includes('status@broadcast') ||
        message.to?.includes('status@broadcast')
      ) {
        console.log('⛔ Mensaje de status ignorado.');
        return;
      }

      this.client.setStatus('online');
      this.client.setStatus('Comunicando con CFE...');
      if (message.type === 'ptt') {
        console.log('🎙️ Nuevo audio de voz de:', telefono);
        const chat = await message.getChat();
        const media = await message.downloadMedia();
        await chat.sendSeen();

        await chat.sendStateTyping();
        console.log('✅ Audio descargado.:', media);
        if (!media) return;

        const buffer = Buffer.from(media.data, 'base64');
        console.log('Tamaño del buffer:', buffer.length);

        console.log('✅ Audio convertido a buffer.');
        // Opcional: guarda el audio para pruebas
        // const fileName = `./uploads/audios/audio_${Date.now()}.ogg`;
        // writeFile(fileName, buffer, 'base64', (err) => {
        //   if (err) {
        //     console.error('❌ Error al guardar el audio:', err.message);
        //   } else {
        //     console.log(`✅ Audio guardado como ${fileName}.`);
        //   }
        // });
        // Transcribe

        const transcripcion =
          await this.transcripcionService.transcribirDesdeBuffer(buffer);
        console.log(`Transcripción: ${transcripcion}`);
        if (transcripcion === 'No se pudo transcribir.') {
          await this.enviarMensaje(
            message.from,
            '❌ No entendí tu audio, ¿puedes intentarlo de nuevo?',
          );
          return;
        }

        const respuesta = await this.respuestaMensajesService.responderPregunta(
          transcripcion,
          telefono,
        );

        if (respuesta.audioPath) {
          await chat.sendStateRecording();
          console.log('Respuesta con audio: ', respuesta);
          await this.enviarAudioComoRespuesta(telefono, respuesta.audioPath);
          return;
        }
        console.log('Respuesta sin audio: ', respuesta);
        await this.enviarMensaje(message.from, respuesta.text);
        await chat.clearState();
      } else {
        const texto = message.body.toLowerCase();
        console.log('📧 Nuevo mensaje de texto:', telefono, texto);
        const chat = await message.getChat();
        await chat.sendSeen();
        await this.delay(1000);
        await chat.sendStateTyping();

        const respuesta = await this.respuestaMensajesService.responderPregunta(
          texto,
          telefono,
        );
        console.log('Respuesta: ', respuesta);
        if (respuesta.audioPath) {
          await chat.sendStateRecording();
          console.log('Respuesta con audio: ', respuesta);
          await this.enviarAudioComoRespuesta(telefono, respuesta.audioPath);
          return;
        }
        console.log('Respuesta sin audio: ', respuesta);
        await this.enviarMensaje(message.from, respuesta.text);
        await chat.clearState();
      }
    });

    await this.client.initialize();
  }

  setSocketServer(io: Server) {
    this.io = io;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async delayRandom() {
    const min = 4000;
    const max = 7000;
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.delay(ms);
  }

  async enviarMensaje(numero: string, mensaje: string) {
    try {
      await this.botReady;

      if (!this.client || !this.client.info?.wid) {
        throw new Error('Cliente de WhatsApp no está listo o se desconectó');
      }

      const chatId = numero.includes('@c.us') ? numero : `${numero}@c.us`;
      this.logger.debug(`📤 Enviando a ${chatId}: ${mensaje}`);

      const isRegistered = await this.client.isRegisteredUser(chatId);
      if (!isRegistered) {
        throw new Error(`Número no registrado en WhatsApp: ${numero}`);
      }

      const chat = await this.client.getChatById(chatId).catch(() => null);

      await this.client.sendMessage(chatId, mensaje);
      if (chat) {
        await chat.clearState();
      }
    } catch (err) {
      this.logger.warn(`❌ Error al enviar mensaje: ${err.message}`);
    }
  }

  async enviarAudioComoRespuesta(numero: string, rutaAudio: string) {
    const media = MessageMedia.fromFilePath(rutaAudio);
    await this.client.sendMessage(`${numero}@c.us`, media, {
      sendAudioAsVoice: true,
    });

    // 👇 Elimina el archivo después de enviarlo
    try {
      await fs.unlink(rutaAudio);
      console.log(`✅ Archivo de audio eliminado: ${rutaAudio}`);
    } catch (error) {
      console.error(`❌ Error al eliminar el archivo:`, error);
    }
  }

  // 📦 Enviar mensajes pendientes cada 60 segundos
  //@Interval(60000)
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

      this.logger.debug(`🕐 ${mensajes.length} mensajes pendientes`);

      for (const mensaje of mensajes) {
        if (mensaje.enviado) continue;
        await this.delayRandom();
        try {
          await this.enviarMensaje(mensaje.telefono, mensaje.contenido);
          await this.manejoDeMensajesService.marcarComoEnviado(mensaje.id);
          this.logger.debug(`✅ Mensaje enviado a ${mensaje.telefono}`);
        } catch (err) {
          this.logger.error(`❌ Error con ${mensaje.telefono}: ${err.message}`);
        }

        await this.delayRandom(); // para evitar bloqueo por spam
      }
    } catch (err) {
      this.logger.error('❌ Error en enviarMensajesPendientes:', err.message);
    } finally {
      this.enviandoMensajes = false; // Liberar el flag siempre
    }
  }
}
