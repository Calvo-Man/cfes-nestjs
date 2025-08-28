import { Module } from '@nestjs/common';
import { PeticionesService } from './peticiones.service';
import { PeticionesController } from './peticiones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Peticion } from './entities/peticione.entity';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Peticion]),
  ],
  controllers: [PeticionesController],
  providers: [PeticionesService,JwtService],
  exports: [PeticionesService],
})
export class PeticionesModule {}
