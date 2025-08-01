// src/aseos/aseo.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AseoGateway {
  @WebSocketServer()
  server: Server;

  notificarNuevoHorario() {
    this.server.emit('nuevo-horario', {
      mensaje: '📅 Se generó un nuevo horario de aseo',
    });
    console.log('📅 Se generó un nuevo horario de aseo');
  }
}
