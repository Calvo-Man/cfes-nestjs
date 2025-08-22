import { Module } from '@nestjs/common';
import { PeticionesService } from './peticiones.service';
import { PeticionesController } from './peticiones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Peticion } from './entities/peticione.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Peticion]),
  ],
  controllers: [PeticionesController],
  providers: [PeticionesService],
  exports: [PeticionesService],
})
export class PeticionesModule {}
