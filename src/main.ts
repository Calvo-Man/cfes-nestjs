import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { json, urlencoded } from 'express';

async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
  }

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors(); // considera limitarlo a tu frontend en producción
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  // Puerto dinámico para Fly.io
  await app.listen(process.env.PORT || 3000);
}

bootstrap();
