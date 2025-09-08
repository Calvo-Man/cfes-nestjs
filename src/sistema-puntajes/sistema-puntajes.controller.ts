import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { PuntajeService } from './sistema-puntajes.service';

@Controller('sistema-puntajes')
export class PuntajesController {
  constructor(private readonly sistemaPuntajesService: PuntajeService) {}

  // @Post()
  // create(@Body() createSistemaPuntajeDto: CreateSistemaPuntajeDto) {
  //   return this.sistemaPuntajesService.create(createSistemaPuntajeDto);
  // }

  // @Get()
  // findAll() {
  //   return this.sistemaPuntajesService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.sistemaPuntajesService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateSistemaPuntajeDto: UpdateSistemaPuntajeDto) {
  //   return this.sistemaPuntajesService.update(+id, updateSistemaPuntajeDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.sistemaPuntajesService.remove(+id);
  // }
}
