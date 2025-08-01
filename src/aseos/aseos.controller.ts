import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AseosService } from './aseos.service';
import { CreateAseoDto } from './dto/create-aseo.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { Request } from 'express';
import { AseoCronService } from './aseo-cron.service';
import { RolesGuard } from 'src/roles/role-guard/role.guard';
@UseGuards(RolesGuard)

@Controller('aseos')
export class AseosController {
  constructor(
    private readonly aseosService: AseosService,
    private readonly aseoCronService: AseoCronService,
  ) {}

  @Post()
  create(@Body() createAseoDto: CreateAseoDto) {
    return this.aseosService.create(createAseoDto);
  }

  @Get()
  findAll() {
    return this.aseosService.getAsignacionesAgrupadasPorMes();
  }
  @Get('agrupado-por-mes')
  async getAgrupadoPorMes() {
    return this.aseosService.getAsignacionesAgrupadasPorMes();
  }
  @Post('generar')
  async generarHorarioMensualDeAseo() {
    return this.aseoCronService.generarHorarioMensualDeAseo();
  }

  @Post('enviar')
  @UseInterceptors(
    FileInterceptor('pdf', {
      storage: diskStorage({
        destination: './uploads/pdf',
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    }),
  )
  async recibirPdf(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    // Obtener protocolo y host dinámicamente
    const protocolo = req.protocol;
    const host = req.get('host'); // incluye puerto si aplica

    const url = `${protocolo}://${host}/uploads/pdf/${file.filename}`;
    console.log('📎 URL del PDF:', url);
    const to = '3024064896';
    //await this.whatsappService.enviarArchivoPorWhatsApp(url, to);
    return { ok: true, enviado: file.originalname, url };
  }
}
