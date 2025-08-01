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
import { CasasDeFeService } from './casas-de-fe.service';
import { CreateCasasDeFeDto } from './dto/create-casas-de-fe.dto';
import { UpdateCasasDeFeDto } from './dto/update-casas-de-fe.dto';
import { RolesGuard } from 'src/roles/role-guard/role.guard';

@Controller('casas-de-fe')
@UseGuards(RolesGuard)
export class CasasDeFeController {
  constructor(private readonly casasDeFeService: CasasDeFeService) {}

  @Post()
  create(@Body() createCasasDeFeDto: CreateCasasDeFeDto) {
    return this.casasDeFeService.create(createCasasDeFeDto);
  }
  @Get('cercano')
  async puntoMasCercano(@Query('lat') lat: string, @Query('lon') lon: string) {
    return this.casasDeFeService.obtenerPuntoMasCercano(
      parseFloat(lat),
      parseFloat(lon),
    );
  }
  // puntos.controller.ts
  @Get('buscar-cercano')
  async buscarDesdeBarrio(@Query('barrio') barrio: string) {
    return this.casasDeFeService.buscarPuntoMasCercanoDesdeBarrio(barrio);
  }
  @Get('buscar-casa-cercano')
  async buscarCasaCercano(@Query('barrio') barrio: string) {
    return this.casasDeFeService.puntoMasCercanoDesde(barrio);
  }
  @Get()
  findAll() {
    return this.casasDeFeService.findAll();
  }

  @Get('user/:user')
  findAllByUser(@Param('user') user: string) {
    console.log(user);
    return this.casasDeFeService.findAllByUser(user);
  }
  @Get('count')
  countCasasDeFe() {
    return this.casasDeFeService.countCasasDeFe();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casasDeFeService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCasasDeFeDto: UpdateCasasDeFeDto,
  ) {
    return this.casasDeFeService.update(+id, updateCasasDeFeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.casasDeFeService.remove(+id);
  }
}
