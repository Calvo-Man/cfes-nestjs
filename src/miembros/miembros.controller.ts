import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MiembrosService } from './miembros.service';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { RolesGuard } from 'src/roles/role-guard/role.guard';
import { Roles } from 'src/roles/decorator/roles.decorator';
import { Rol } from 'src/roles/enum/roles.enum';
import { Horario } from './enum/horario.enum';
@Controller('miembros')
//@UseGuards(RolesGuard)
export class MiembrosController {
  constructor(private readonly miembrosService: MiembrosService) {}

  @Post('create')
  //@Roles(Rol.PASTOR)
  create(@Body() createMiembroDto: CreateMiembroDto) {
    return this.miembrosService.create(createMiembroDto);
  }
  // @Post('poblar/:cantidad')
  // async poblar(@Param('cantidad') cantidad: string) {
  //   const n = parseInt(cantidad);
  //   return this.miembrosService.poblarMiembrosDePrueba(n);
  // }

  @Roles(Rol.PASTOR)
  @Get('count')
  count() {
    return this.miembrosService.countMiembros();
  }

 
  @Get()
  findAll() {
    return this.miembrosService.getMiembros();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.miembrosService.findOne(+id);
  }

  @Get('asignedAseosCurrentMonth/:miembroId')
  findAsignedAseosCurrentMonthById(@Param('miembroId') miembroId: string) {
    return this.miembrosService.findAsignedAseosCurrentMonthById(+miembroId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMiembroDto: UpdateMiembroDto) {
    return this.miembrosService.update(+id, updateMiembroDto);
  }
  @Patch('horario/:id')
  updateHorario(@Param('id') id: string, @Body() updateMiembroDto:UpdateMiembroDto) {
    return this.miembrosService.updateHorarioAseo(+id, updateMiembroDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.miembrosService.remove(+id);
  }
  @Delete('softDelete/:id')
  softDelete(@Param('id') id: string) {
    return this.miembrosService.softDelete(+id);
  }
}
