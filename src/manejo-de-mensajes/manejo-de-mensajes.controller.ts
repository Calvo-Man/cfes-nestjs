import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ManejoDeMensajesService } from './manejo-de-mensajes.service';
import { CreateManejoDeMensajeDto } from './dto/create-manejo-de-mensaje.dto';
import { UpdateManejoDeMensajeDto } from './dto/update-manejo-de-mensaje.dto';

@Controller('manejo-de-mensajes')
export class ManejoDeMensajesController {
  constructor(
    private readonly manejoDeMensajesService: ManejoDeMensajesService,
  ) {}

  @Post('enviar-mensajes')
  enviarVariosMensajes(
    @Body() createManejoDeMensajeDto: CreateManejoDeMensajeDto,
  ) {
    return this.manejoDeMensajesService.guardarVariosMensajes(
      createManejoDeMensajeDto,
    );
  }
}
