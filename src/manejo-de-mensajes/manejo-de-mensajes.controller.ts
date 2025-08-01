// import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
// import { ManejoDeMensajesService } from './manejo-de-mensajes.service';
// import { CreateManejoDeMensajeDto } from './dto/create-manejo-de-mensaje.dto';
// import { UpdateManejoDeMensajeDto } from './dto/update-manejo-de-mensaje.dto';

// @Controller('manejo-de-mensajes')
// export class ManejoDeMensajesController {
//   constructor(private readonly manejoDeMensajesService: ManejoDeMensajesService) {}

//   @Post()
//   create(@Body() createManejoDeMensajeDto: CreateManejoDeMensajeDto) {
//     return this.manejoDeMensajesService.create(createManejoDeMensajeDto);
//   }

//   @Get()
//   findAll() {
//     return this.manejoDeMensajesService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.manejoDeMensajesService.findOne(+id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateManejoDeMensajeDto: UpdateManejoDeMensajeDto) {
//     return this.manejoDeMensajesService.update(+id, updateManejoDeMensajeDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.manejoDeMensajesService.remove(+id);
//   }
// }
