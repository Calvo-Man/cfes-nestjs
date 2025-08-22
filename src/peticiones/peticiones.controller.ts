import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { PeticionesService } from './peticiones.service';
import { CreatePeticionDto } from './dto/create-peticione.dto';
import { UpdatePeticionDto } from './dto/update-peticione.dto';

@Controller('peticiones')
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
  async actualizar(
    @Param('id') id: string,
    @Body() updatePeticionDto: UpdatePeticionDto,
  ) {
    return await this.peticionesService.actualizar(+id, updatePeticionDto);
  }

  // 📌 Marcar como "En oración"
  @Patch(':id/en-oracion')
  async marcarEnOracion(@Param('id') id: string) {
    return await this.peticionesService.marcarEnOracion(+id);
  }

  // 📌 Marcar como "Respondida"
  @Patch(':id/respondida')
  async marcarRespondida(@Param('id') id: string) {
    return await this.peticionesService.marcarRespondida(+id);
  }

  // 📌 Eliminar petición
  @Delete(':id')
  async eliminar(@Param('id') id: string) {
    return await this.peticionesService.eliminar(+id);
  }
}
