// src/services/transcripcion.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeStatic from 'ffprobe-static';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

@Injectable()
export class TranscripcionService {
  private speechClient: any;

  constructor() {
    const speech = require('@google-cloud/speech');
    const keyPath = process.env.SPECH_TO_TEXT;
    this.speechClient = new speech.SpeechClient({
      keyFilename: keyPath,
    });
  }

  async transcribirDesdeBuffer(buffer: Buffer): Promise<string> {
    const audioBytes = buffer.toString('base64');

    try {
      const request = {
        audio: { content: audioBytes },
        config: {
          encoding: 'OGG_OPUS',
          sampleRateHertz: 16000,
          languageCode: 'es-CO',
        },
      };
      const [response] = await this.speechClient.recognize(request);
      const transcription = response.results
        ?.map((r) => r.alternatives?.[0].transcript)
        .join('\n');
      console.log('✅ Transcripción:', transcription);
      if (transcription === '') {
        const request = {
          audio: { content: audioBytes },
          config: {
            encoding: 'OGG_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'es-CO',
          },
        };
        const [response] = await this.speechClient.recognize(request);
        const transcription = response.results
          ?.map((r) => r.alternatives?.[0].transcript)
          .join('\n');

        console.log('✅ Transcripción:', transcription);
        return transcription;
      }
      console.log('✅ Transcripción:', transcription);
      return transcription;
    } catch (error) {
      console.error('❌ Error al transcribir:', error);
      return 'No se pudo transcribir.';
    }
  }
}
