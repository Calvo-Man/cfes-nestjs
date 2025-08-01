// openroute.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OpenRouteService {
  private readonly apiKey =
    '5b3ce3597851110001cf6248564aa1bf4fee4f55b5fa113d92127b8b';

  async calcularRuta(origen: [number, number], destino: [number, number]) {
    const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
    try {
      const response = await axios.post(
        url,
        {
          coordinates: [origen, destino],
        },
        {
          headers: {
            Authorization: this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      const distancia = response.data.routes[0].summary.distance; // metros
      return distancia;
    } catch (error) {
      console.error(
        'Error en OpenRouteService:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }
  
}
