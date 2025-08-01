// geocoding.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY; // 🔁 reemplaza esto

  async obtenerCoordenadas(direccion: string) {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';

    try {
      const response = await axios.get(url, {
        params: {
          address: direccion + ', San Pelayo, Córdoba, Colombia',
          key: this.apiKey,
        },
      });
      console.log(response.data);

      if (response.data.status !== 'OK') {
        throw new InternalServerErrorException(
          'No se pudo geolocalizar la dirección',
        );
      }

      const location = response.data.results[0].geometry.location;
      return {
        latitud: location.lat,
        longitud: location.lng,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error consultando Google Maps:' + error.message);
    }
  }
  
}
