import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { UpdateEventoDto } from "./dto/update-evento.dto";
import { Roles } from "src/roles/decorator/roles.decorator";
import { Rol } from "src/roles/enum/roles.enum";
import { EventosService } from "./eventos.service";
import { CreateEventoDto } from "./dto/create-evento.dto";
import { RolesGuard } from "src/roles/role-guard/role.guard";

@Controller('eventos')
@UseGuards(RolesGuard) // <-- Descomenta si quieres proteger todos los métodos
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Post()
  @Roles(Rol.PASTOR)
  create(@Body() createEventoDto: CreateEventoDto) {
    return this.eventosService.create(createEventoDto);
  }

  @Get()
  findAll() {
    return this.eventosService.findAllAgrupadoPorMes();
  }

  @Get('count')
  countEventos() {
    return this.eventosService.countEventosThisMonth();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventoDto: UpdateEventoDto,
  ) {
    return this.eventosService.update(id, updateEventoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.remove(id);
  }
}
