import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiembrosModule } from './miembros/miembros.module';
import { RolesModule } from './roles/roles.module';
import { AseosModule } from './aseos/aseos.module';
import { RoleSeedModule } from './roles/roles-seed.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AsistenciasModule } from './asistencias/asistencias.module';
import { CasasDeFeModule } from './casas-de-fe/casas-de-fe.module';
import { EventosModule } from './eventos/eventos.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { MiembroCasaDeFeModule } from './miembro-casa-de-fe/miembro-casa-de-fe.module';
import { WhatsappBotModule } from './whatsapp-bot/whatsapp-bot.module';
import { ManejoDeMensajesModule } from './manejo-de-mensajes/manejo-de-mensajes.module';
import { GeocodingService } from './geolocalizacion/geocoding.service';
import { ContratosModule } from './contratos/contratos.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
      ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', // Esto hace que la URL sea: http://localhost:3000/uploads
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        connectTimeout: 40000,
        autoLoadEntities: true,
        ssl: {
          rejectUnauthorized: false
        },
      }),
      inject: [ConfigService],
    }),
    MiembrosModule,
    RolesModule,
    AseosModule,
    RoleSeedModule,
    AsistenciasModule,
    CasasDeFeModule,
    EventosModule,
    AuthModule,
    MiembroCasaDeFeModule,
    WhatsappBotModule,
    ManejoDeMensajesModule,
    ContratosModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}