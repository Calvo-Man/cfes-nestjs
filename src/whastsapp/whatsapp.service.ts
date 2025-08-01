// src/whatsapp/whatsapp.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly token: string;
  private readonly phoneNumberId: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('TOKEN_WHATSAPP')!;
    this.phoneNumberId = this.configService.get<string>(
      'WHATSAPP_PHONE_NUMBER_ID',
    )!;
    this.baseUrl = `https://graph.facebook.com/v22.0/${this.phoneNumberId}/messages`;
  }

  async enviarMensajeTexto(to: string, mensaje: string): Promise<any> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body: mensaje,
        },
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        '❌ Error al enviar mensaje de WhatsApp:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }
  async enviarMensajePlantillaConVariables(
    to: string,
    nombrePlantilla: string,
    variables: string[],
    idioma = 'es',
  ) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: nombrePlantilla,
          language: { code: idioma },
          components: [
            {
              type: 'body',
              parameters: variables.map((v) => ({ type: 'text', text: v })),
            },
          ],
        },
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        '❌ Error al enviar plantilla:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
