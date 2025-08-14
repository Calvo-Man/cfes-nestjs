// teologia.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TeologiaService } from '../services/teologia.service';
import { RolesGuard } from 'src/roles/role-guard/role.guard';
import { Roles } from 'src/roles/decorator/roles.decorator';
import { Rol } from 'src/roles/enum/roles.enum';


@Controller('teologia')
@UseGuards(RolesGuard)
export class TeologiaController {
  constructor(private readonly teologiaService: TeologiaService) {}

  @Post('agregar')
  @Roles(Rol.ADMINISTRADOR) // Asegúrate de que los roles estén definidos en tu enum de roles
  async agregarPregunta(
    @Body() body: { pregunta: string; respuesta: string, fuente: string  },
  ) {
    return await this.teologiaService.agregarPregunta(
      body.pregunta,
      body.respuesta,
      body.fuente,
    );
  }
}
