// teologia.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { TeologiaService } from '../services/teologia.service';


@Controller('teologia')
export class TeologiaController {
  constructor(private readonly teologiaService: TeologiaService) {}

  @Post('agregar')
  async agregarPregunta(
    @Body() body: { pregunta: string; respuesta: string },
  ) {
    return await this.teologiaService.agregarPregunta(
      body.pregunta,
      body.respuesta,
    );
  }
}
