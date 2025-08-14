import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { RolesGuard } from 'src/roles/role-guard/role.guard';
import { Roles } from 'src/roles/decorator/roles.decorator';
import { Rol } from 'src/roles/enum/roles.enum';

@Controller('contratos')
@UseGuards(RolesGuard)
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR, Rol.PASTOR) // Asegúrate de que el rol 'administrador' esté definido en tu enum de roles
  create(@Body() createContratoDto: CreateContratoDto) {
    return this.contratosService.create(createContratoDto);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.PASTOR) // Asegúrate de que el rol 'administrador' esté definido en tu enum de roles
  findAll() {
    return this.contratosService.findAll();
  }

  
}
