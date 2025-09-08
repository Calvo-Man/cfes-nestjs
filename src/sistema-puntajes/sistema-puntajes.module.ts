import { Module } from '@nestjs/common';
import { PuntajesController } from './sistema-puntajes.controller';
import { PuntajeService } from './sistema-puntajes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puntaje } from './entities/puntaje.entity';
import { Trivia } from './entities/trivia.entity';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { PuntajeSemanal } from './entities/puntaje-semanal.entity';
import { TriviaService } from './trivia.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Miembro, Puntaje, Trivia, PuntajeSemanal]),

  ],
  controllers: [PuntajesController],
  providers: [PuntajeService,TriviaService],
  exports: [PuntajeService,TriviaService],
})
export class PuntajesModule {}
