import { Module } from '@nestjs/common';
import { ContratosService } from './contratos.service';
import { ContratosController } from './contratos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contrato } from './entities/contrato.entity';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contrato, Miembro]),
  ],
  controllers: [ContratosController],
  providers: [ContratosService,JwtService],
})
export class ContratosModule {}
