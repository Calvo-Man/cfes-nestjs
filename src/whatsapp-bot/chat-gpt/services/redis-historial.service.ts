import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
   client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  async onModuleInit() {
    this.client = createClient({
      username: 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
      
    });

    this.client.on('error', (err) => this.logger.error('Redis error', err));

    await this.client.connect();
    this.logger.log('✅ Redis conectado');
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  // Métodos de ayuda
  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }
   // ----------------- Métodos útiles -----------------
  rpush(key: string, value: string) {
    return this.client.rPush(key, value);
  }

  lrange(key: string, start = 0, stop = -1) {
    return this.client.lRange(key, start, stop);
  }

  lindex(key: string, index = -1) {
    return this.client.lIndex(key, index);
  }

  rpop(key: string) {
    return this.client.rPop(key);
  }

  expire(key: string, seconds: number) {
    return this.client.expire(key, seconds);
  }

  ltrim(key: string, start: number, stop: number) {
    return this.client.lTrim(key, start, stop);
  }

  lset(key: string, index: number, value: string) {
    return this.client.lSet(key, index, value);
  }
}
