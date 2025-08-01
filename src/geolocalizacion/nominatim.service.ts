// src/nominatim/nominatim.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NominatimService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

  async obtenerCoordenadas(direccion: string): Promise<{ lat: number; lon: number }> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          q: `${direccion}, San Pelayo, Córdoba, Colombia`,
          format: 'json',
          addressdetails: 1,
          limit: 1,
        },
        headers: {
          'User-Agent': 'aseo-app/1.0 (macunahernandez597@gmail.com)', // Requerido por Nominatim
        },
      });
     

      const resultados = response.data;
      if (!resultados || resultados.length === 0) {
        throw new InternalServerErrorException('No se encontraron coordenadas para esta dirección.');
      }
      console.log(resultados[0].lat, resultados[0].lon);
      return {
        lat: parseFloat(resultados[0].lat),
        lon: parseFloat(resultados[0].lon),
      };
    } catch (error) {
      console.error('Error en Nominatim:', error.message);
      throw new InternalServerErrorException('Error al consultar Nominatim: ' + error.message);
    }
  }
}
