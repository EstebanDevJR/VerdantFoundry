import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { Public } from './auth/decorators/public.decorator';
import * as http from 'http';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private rabbit: RabbitMQService,
    private config: ConfigService,
  ) {}

  @Get()
  async getHealth() {
    const result: {
      database: 'up' | 'down';
      redis: 'up' | 'down';
      rabbitmq: 'up' | 'down';
      aiEngine: 'up' | 'down';
    } = {
      database: 'down',
      redis: 'down',
      rabbitmq: 'down',
      aiEngine: 'down',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      result.database = 'up';
    } catch {
      result.database = 'down';
    }

    try {
      const client = this.redis.getClient();
      if (client) {
        await client.ping();
        result.redis = 'up';
      }
    } catch {
      result.redis = 'down';
    }

    try {
      // If a channel exists, assume RabbitMQ is reachable (connection established by RabbitMQService)
      // We don't open a new connection here to avoid overhead.
      // If the channel is null, consider it down.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyRabbit = this.rabbit as any;
      result.rabbitmq = anyRabbit['channel'] ? 'up' : 'down';
    } catch {
      result.rabbitmq = 'down';
    }

    const aiUrl = this.config.get<string>('AI_ENGINE_URL') || 'http://localhost:8000';
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(aiUrl + '/health/', (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve();
          else reject(new Error(`status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(2000, () => {
          req.destroy(new Error('timeout'));
        });
      });
      result.aiEngine = 'up';
    } catch {
      result.aiEngine = 'down';
    }

    return {
      status: Object.values(result).every((v) => v === 'up') ? 'ok' : 'degraded',
      ...result,
    };
  }
}

