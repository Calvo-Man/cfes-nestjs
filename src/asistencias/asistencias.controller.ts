import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AsistenciasService } from './asistencias.service';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { RolesGuard } from 'src/roles/role-guard/role.guard';
import { Roles } from 'src/roles/decorator/roles.decorator';
import { Rol } from 'src/roles/enum/roles.enum';
@UseGuards(RolesGuard)
@Controller('asistencias')
export class AsistenciasController {
  constructor(private readonly asistenciasService: AsistenciasService) {}

  @Post()
  create(@Body() createAsistenciaDto: CreateAsistenciaDto) {
    return this.asistenciasService.create(createAsistenciaDto);
  }

  @Get()
  findAll() {
    return this.asistenciasService.findAll();
  }

  @Get('count')
  count() {
    return this.asistenciasService.countAsistenciasThisMonth();
  }
  @Get('countAllPerMonth')
  countAllPerMonth() {
    return this.asistenciasService.countAsistenciasPorMeses();
  }
  @Get('findRecurrentes')
  async findRecurrentes() {
    return await this.asistenciasService.findRecurrentes();
  }
  @Get('findNoRecurrentes')
  async findNoRecurrentes() {
    return await this.asistenciasService.findNoRecurrentes();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.asistenciasService.findOneById(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAsistenciaDto: UpdateAsistenciaDto,
  ) {
    return this.asistenciasService.update(+id, updateAsistenciaDto);
  }
  @Patch('setRecurrente/:id')
  @Roles(Rol.ADMINISTRADOR, Rol.LIDER, Rol.PASTOR)
  setRecurrente(@Param('id') id: string, ) {
    return this.asistenciasService.setRecurrente(+id, );
  }
  
  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.LIDER, Rol.PASTOR) // Asegúrate de que el rol 'administrador' esté definido en tu enum de roles
  remove(@Param('id') id: string) {
    return this.asistenciasService.remove(+id);
  }
}
