import { Test, TestingModule } from '@nestjs/testing';
import { MiembroCasaDeFeService } from './miembro-casa-de-fe.service';

describe('MiembroCasaDeFeService', () => {
  let service: MiembroCasaDeFeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MiembroCasaDeFeService],
    }).compile();

    service = module.get<MiembroCasaDeFeService>(MiembroCasaDeFeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
