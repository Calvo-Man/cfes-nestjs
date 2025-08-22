import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCasasDeFeDto } from './dto/create-casas-de-fe.dto';
import { UpdateCasasDeFeDto } from './dto/update-casas-de-fe.dto';

// puntos.service.ts
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CasasDeFe } from './entities/casas-de-fe.entity';
import { getDistance } from 'geolib';
import { GeocodingService } from 'src/geolocalizacion/geocoding.service';
import { NominatimService } from 'src/geolocalizacion/nominatim.service';
import { OpenRouteService } from 'src/geolocalizacion/openroute.service';
import { OpenCageService } from 'src/geolocalizacion/opencage.service';
import { Miembro } from 'src/miembros/entities/miembro.entity';
import { plainToInstance } from 'class-transformer';
import { CasaDeFeDTO } from './dto/casa.dto';
import e from 'express';

@Injectable()
export class CasasDeFeService {
  constructor(
    @InjectRepository(CasasDeFe)
    private readonly casasDeFeRepository: Repository<CasasDeFe>,
    @InjectRepository(Miembro)
    private readonly miembroRepository: Repository<Miembro>,
    private readonly geocodingService: GeocodingService,
    private readonly openRouteService: OpenRouteService,
    private readonly openCageService: OpenCageService,
  ) {}

  async create(createCasasDeFeDto: CreateCasasDeFeDto) {
    const findCasasDeFe = await this.casasDeFeRepository.findOne({
      where: {
        nombre: createCasasDeFeDto.nombre,
      },
    });

    if (findCasasDeFe) {
      throw new ConflictException('El punto ya existe');
    }
    const encargados = await this.miembroRepository.findBy({
      id: In(createCasasDeFeDto.encargadosId),
    });
    const punto = this.casasDeFeRepository.create({
      ...createCasasDeFeDto,
      encargadosId: encargados,
    });
    const saved = await this.casasDeFeRepository.save(punto);

    return {
      message: 'Casa de fé creada con exito',
      status: 201,
      data: saved,
    };
  }
  async obtenerPuntoMasCercano(lat: number, lon: number) {
    const puntos = await this.casasDeFeRepository.find();

    if (!puntos.length) {
      throw new NotFoundException('No hay puntos registrados');
    }

    let puntoCercano = puntos[0];
    let menorDistancia = getDistance(
      { latitude: lat, longitude: lon },
      { latitude: puntoCercano.latitud, longitude: puntoCercano.longitud },
    );

    for (const punto of puntos) {
      const dist = getDistance(
        { latitude: lat, longitude: lon },
        { latitude: punto.latitud, longitude: punto.longitud },
      );
      if (dist < menorDistancia) {
        menorDistancia = dist;
        puntoCercano = punto;
      }
    }

    return puntoCercano;
  }
  async buscarPuntoMasCercano(barrio: string) {
    const origen = await this.openCageService.obtenerCoordenadas(barrio);
    const puntos = await this.casasDeFeRepository.find(); // tus puntos guardados

    // Calcula distancia y encuentra el más cercano
    let puntoMasCercano: CasasDeFe | null = null;
    let distanciaMinima = Infinity;

    for (const punto of puntos) {
      const distancia = this.distanciaHaversine(
        origen.lat,
        origen.lon,
        punto.latitud,
        punto.longitud,
      );

      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        puntoMasCercano = punto;
      }
    }

    return puntoMasCercano;
  }
  private distanciaHaversine(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.gradosARadianes(lat2 - lat1);
    const dLon = this.gradosARadianes(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.gradosARadianes(lat1)) *
        Math.cos(this.gradosARadianes(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  private gradosARadianes(grados: number): number {
    return grados * (Math.PI / 180);
  }
  async buscarPuntoMasCercanoDesdeBarrio(barrio: string) {
    const coords = await this.geocodingService.obtenerCoordenadas(barrio);
    return this.obtenerPuntoMasCercano(coords.latitud, coords.longitud);
  }

  async puntoMasCercanoDesde(direccion: string) {
    const origen = await this.openCageService.obtenerCoordenadas(direccion);
    const origenCoords: [number, number] = [origen.lon, origen.lat];
    const puntos = await this.casasDeFeRepository.find(); // tus puntos guardados

    //let puntoCercano : CasasDeFe | null = null;
    let puntoCercano: (CasasDeFe & { distancia: number }) | null = null;

    let menorDistancia = Infinity;

    for (const punto of puntos) {
      const destino: [number, number] = [punto.longitud, punto.latitud];
      try {
        const distancia = await this.openRouteService.calcularRuta(
          origenCoords,
          destino,
        );
        if (distancia < menorDistancia) {
          menorDistancia = distancia;
          puntoCercano = { ...punto, distancia };
        }
      } catch (error) {
        console.warn(`No se pudo calcular ruta a ${punto.nombre}`);
      }
    }

    return puntoCercano;
  }
  async findAll() {
    const casas = await this.casasDeFeRepository.find({
      relations: ['encargadosId', 'asistencias', 'miembros'],
      order: { id: 'DESC' },
    });

    return plainToInstance(CasaDeFeDTO, casas, {
      excludeExtraneousValues: true,
    });
  }
  async sendInformationToAll() {
    const casas = await this.casasDeFeRepository.find({
      relations: ['encargadosId', 'asistencias', 'miembros'],
      order: { id: 'DESC' },
    });
   return {
    nombre: casas.map((c) => c.nombre),
    direccion: casas.map((c) => c.direccion),
    encargados: casas.map((c) => c.encargadosId.map((e) => [e.name, e.apellido,e.rol])),
   }
  }
async findAllByUser(user: string) {
  const miembro = await this.miembroRepository.findOne({
    where: { user },
  });
  if (!miembro) {
    throw new BadRequestException('Miembro no encontrado');
  }

  const casas = await this.casasDeFeRepository
    .createQueryBuilder('casa')
    .leftJoinAndSelect('casa.encargadosId', 'encargado')
    .leftJoinAndSelect('casa.asistencias', 'asistencias')
    .leftJoinAndSelect('casa.miembros', 'miembros')
    // 🔹 El filtro va en EXISTS sobre la tabla intermedia
    .where(qb => {
      const subQuery = qb.subQuery()
        .select('1')
        .from('casas_de_fe_encargados_id_miembro', 'cemi') // 👈 tabla intermedia
        .where('cemi.casasDeFeId = casa.id')
        .andWhere('cemi.miembroId = :id')
        .getQuery();
      return `EXISTS ${subQuery}`;
    })
    .setParameter('id', miembro.id)
    .orderBy('casa.id', 'DESC')
    .getMany();

  return plainToInstance(CasaDeFeDTO, casas, {
    excludeExtraneousValues: true,
  });
}



  async findOne(id: number) {
    const punto = await this.casasDeFeRepository.findOne({
      where: { id },
      relations: ['encargadosId'],
    });

    if (!punto) {
      throw new NotFoundException('Casa de fe no encontrada');
    }
    return punto;
  }

  async countCasasDeFe() {
    return await this.casasDeFeRepository.count();
  }
  async update(id: number, updateCasasDeFeDto: UpdateCasasDeFeDto) {
    const punto = await this.casasDeFeRepository.findOne({ where: { id } });
    if (!punto) {
      throw new NotFoundException('Casa de fe no encontrada');
    }
    const encargados = await this.miembroRepository.findBy({
      id: In(updateCasasDeFeDto.encargadosId),
    });
    if (!encargados) {
      throw new NotFoundException('Encargados no encontrados');
    }

    return await this.casasDeFeRepository.update(id, {
      ...updateCasasDeFeDto,
      encargadosId: encargados,
    });
  }

  async remove(id: number) {
    const punto = await this.casasDeFeRepository.findOne({ where: { id } });
    if (!punto) {
      throw new NotFoundException('Casa de fe no encontrada');
    }
    await this.casasDeFeRepository.remove(punto);
    return { message: 'Casa de fe eliminada con exito', status: 200 };
  }
}
