// src/opencage/opencage.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OpenCageService {
  private readonly apiKey = '8b89b5893e394b75b04b7ecd7fbd9ae6'; // 👈 Reemplaza por tu clave real
  private readonly baseUrl = 'https://api.opencagedata.com/geocode/v1/json';

  async obtenerCoordenadas(direccion: string): Promise<{ lat: number; lon: number }> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          q: `${direccion}, San Pelayo, Córdoba, Colombia`,
          limit: 1,
          language: 'es',
        },
      });

      const resultados = response.data?.results;
      if (!resultados || resultados.length === 0) {
        throw new InternalServerErrorException('No se encontraron coordenadas para esta dirección.');
      }

      const geometry = resultados[0].geometry;
      console.log("latitud:", geometry.lat, "longitud:", geometry.lng); // 👈 Imprime la latitud y longitud en la consola ("geometry.lat, geometry.lng);

      return {
        lat: geometry.lat,
        lon: geometry.lng,
      };
    } catch (error) {
      console.error('Error en OpenCage:', error.message);
      throw new InternalServerErrorException('Error al consultar OpenCage: ' + error.message);
    }
  }
}
