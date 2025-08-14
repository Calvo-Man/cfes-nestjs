import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

@Injectable()
export class TTSService {
  async convertirTextoAAudio(
    texto: string,
    nombreArchivo: string,
  ): Promise<string> {
    const textToSpeech = require('@google-cloud/text-to-speech');

    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.TEXT_TO_SPEECH,
    });

    const request = {
      audioConfig: {
        audioEncoding: 'LINEAR16',
        effectsProfileId: ['small-bluetooth-speaker-class-device'],
        pitch: 0,
        speakingRate: 1.11,
      },
      input: {
        text: texto,
      },
      voice: {
        // languageCode: 'es-ES',
        // name: 'es-ES-Chirp3-HD-Algieba',
        languageCode: 'es-US',
        name: 'es-US-Chirp3-HD-Laomedeia',
        // name: 'es-US-Chirp3-HD-Algenib',
        // name: 'es-US-Chirp3-HD-Despina',
        // "name": "es-US-Chirp3-HD-Enceladus"
      },
    };

    const [response] = await client.synthesizeSpeech(request);

    const mp3Path = `./uploads/audios/${nombreArchivo}.mp3`;
    const oggPath = `./uploads/audios/${nombreArchivo}.ogg`;

    fs.writeFileSync(mp3Path, response.audioContent, 'binary');

    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    try {
      await this.convertirMp3AOgg(mp3Path, oggPath);
    } finally {
      try {
        await fs.unlink(mp3Path); // ✅ Eliminar archivo intermedio
        console.log(`🗑️ Archivo temporal eliminado: ${mp3Path}`);
      } catch (err) {
        console.error(`❌ Error al eliminar archivo mp3:`, err.message);
      }
    }

    return oggPath;
  }

  private convertirMp3AOgg(mp3Path: string, oggPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(mp3Path)
        .audioCodec('libopus')
        .audioBitrate('32k')
        .audioChannels(1)
        .audioFrequency(16000)
        .format('ogg')
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(oggPath);
    });
  }
}
