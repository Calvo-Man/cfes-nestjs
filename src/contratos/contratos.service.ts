import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contrato } from './entities/contrato.entity';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { Miembro } from 'src/miembros/entities/miembro.entity';

@Injectable()
export class ContratosService {
  constructor(
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,

    @InjectRepository(Miembro)
    private readonly miembroRepository: Repository<Miembro>,
  ) {}

  async create(createContratoDto: CreateContratoDto): Promise<Contrato> {
    const { firma, vigente, miembroId } = createContratoDto;

    const miembro = await this.miembroRepository.findOne({ where: { id: miembroId } });
    if (!miembro) {
      throw new NotFoundException(`Miembro con id ${miembroId} no encontrado`);
    }

    const contrato = this.contratoRepository.create({
      firma,
      vigente,
      miembro,
    });

    return this.contratoRepository.save(contrato);
  }

  async findAll() {
  const contratos = await this.contratoRepository.find({
    relations: ['miembro'],
    order: { fecha: 'DESC' },
  });

  return contratos.map((contrato) => ({
    id: contrato.id,
    fecha: contrato.fecha,
    vigente: contrato.vigente,
    firma: contrato.firma,
    miembro: {
      id: contrato.miembro.id,
      name: contrato.miembro.name,
      apellido: contrato.miembro.apellido,
    },
  }));
}

}
