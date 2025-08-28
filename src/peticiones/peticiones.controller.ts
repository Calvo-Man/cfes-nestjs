import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PeticionesService } from './peticiones.service';
import { CreatePeticionDto } from './dto/create-peticione.dto';
import { UpdatePeticionDto } from './dto/update-peticione.dto';
import { RolesGuard } from 'src/roles/role-guard/role.guard';
import { Roles } from 'src/roles/decorator/roles.decorator';
import { Rol } from 'src/roles/enum/roles.enum';

@Controller('peticiones')
@UseGuards(RolesGuard)
export class PeticionesController {
  constructor(private readonly peticionesService: PeticionesService) {}

  // 📌 Crear nueva petición
  @Post()
  async crear(@Body() createPeticionDto: CreatePeticionDto) {
    return await this.peticionesService.crearPeticion(createPeticionDto);
  }

  // 📌 Obtener todas las peticiones
  @Get()
  async obtenerTodas() {
    return await this.peticionesService.obtenerTodas();
  }

  // 📌 Obtener peticiones mensuales
  @Get('/mensuales')
  async obtenerPeticionesMensuales() {
    return await this.peticionesService.countPeticionesPorMeses();
  }

  // 📌 Obtener una petición por ID
  @Get(':id')
  async obtenerUna(@Param('id') id: string) {
    return await this.peticionesService.obtenerUna(+id);
  }

  // 📌 Actualizar petición (cualquier campo)
  @Patch(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.PASTOR)
  async actualizar(
    @Param('id') id: string,
    @Body() updatePeticionDto: UpdatePeticionDto,
  ) {
    return await this.peticionesService.actualizar(+id, updatePeticionDto);
  }

  // 📌 Marcar como "En oración"
  @Patch(':id/en-oracion')
  @Roles(Rol.ADMINISTRADOR, Rol.PASTOR)
  async marcarEnOracion(@Param('id') id: string) {
    return await this.peticionesService.marcarEnOracion(+id);
  }

  // 📌 Marcar como "Respondida"
  @Patch(':id/respondida')
  @Roles(Rol.ADMINISTRADOR, Rol.PASTOR)
  async marcarRespondida(@Param('id') id: string) {
    return await this.peticionesService.marcarRespondida(+id);
  }

  // 📌 Eliminar petición
  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.PASTOR)
  async eliminar(@Param('id') id: string) {
    return await this.peticionesService.eliminar(+id);
  }
}
