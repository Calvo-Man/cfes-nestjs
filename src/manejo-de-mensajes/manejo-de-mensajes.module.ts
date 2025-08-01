import { Module } from '@nestjs/common';
//import { ManejoDeMensajesController } from './manejo-de-mensajes.controller';
import { ManejoDeMensajesService } from './manejo-de-mensajes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mensajes } from './entities/manejo-de-mensaje.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mensajes])],
  //controllers: [ManejoDeMensajesController],
  providers: [ManejoDeMensajesService],
  exports: [ManejoDeMensajesService],
})
export class ManejoDeMensajesModule {}
