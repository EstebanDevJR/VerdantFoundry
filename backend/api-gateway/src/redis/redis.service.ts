import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private subscriber: Redis | null = null;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) return;
    try {
      this.client = new Redis(url);
      this.subscriber = new Redis(url);
      await this.client.ping();
    } catch (err) {
      console.warn('Redis connection failed:', (err as Error).message);
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
    if (this.subscriber) await this.subscriber.quit();
  }

  getClient(): Redis | null {
    return this.client;
  }

  getSubscriber(): Redis | null {
    return this.subscriber;
  }

  async publish(channel: string, message: string) {
    if (!this.client) return;
    await this.client.publish(channel, message);
  }

  subscribe(channel: string, callback: (channel: string, message: string) => void) {
    if (!this.subscriber) return () => {};
    this.subscriber.subscribe(channel);
    const handler = (ch: string, message: string) => {
      if (ch === channel) callback(ch, message);
    };
    this.subscriber.on('message', handler);
    return () => {
      this.subscriber?.unsubscribe(channel);
      this.subscriber?.off('message', handler);
    };
  }
}
