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
import { MiembroCasaDeFeService } from './miembro-casa-de-fe.service';
import { CreateMiembroCasaDeFeDto } from './dto/create-miembro-casa-de-fe.dto';
import { UpdateMiembroCasaDeFeDto } from './dto/update-miembro-casa-de-fe.dto';
import { RolesGuard } from 'src/roles/role-guard/role.guard';
import { AddAsistenciaDto } from './dto/addAsistencia.dto';
@UseGuards(RolesGuard)
@Controller('miembro-casa-de-fe')
export class MiembroCasaDeFeController {
  constructor(
    private readonly miembroCasaDeFeService: MiembroCasaDeFeService,
  ) {}

  @Post()
  create(@Body() createMiembroCasaDeFeDto: CreateMiembroCasaDeFeDto) {
    return this.miembroCasaDeFeService.create(createMiembroCasaDeFeDto);
  }
  @Post('asistencia/miembro')
  AgregarAsistenciaComoMiembro(@Body() addAsistenciaDto: AddAsistenciaDto) {
    return this.miembroCasaDeFeService.AgregarAsistenciaComoMiembro(addAsistenciaDto);
  }
  

  @Get()
  findAll() {
    return this.miembroCasaDeFeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.miembroCasaDeFeService.findOne(+id);
  }


  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMiembroCasaDeFeDto: UpdateMiembroCasaDeFeDto,
  ) {
    return this.miembroCasaDeFeService.update(+id, updateMiembroCasaDeFeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.miembroCasaDeFeService.remove(+id);
  }
}
