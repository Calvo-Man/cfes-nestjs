import { Test, TestingModule } from '@nestjs/testing';
import { MiembroCasaDeFeController } from './miembro-casa-de-fe.controller';
import { MiembroCasaDeFeService } from './miembro-casa-de-fe.service';

describe('MiembroCasaDeFeController', () => {
  let controller: MiembroCasaDeFeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MiembroCasaDeFeController],
      providers: [MiembroCasaDeFeService],
    }).compile();

    controller = module.get<MiembroCasaDeFeController>(MiembroCasaDeFeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
