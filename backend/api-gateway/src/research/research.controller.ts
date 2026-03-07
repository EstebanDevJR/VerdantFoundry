import { Controller, Get, Post, Patch, Body, Param, Query, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ResearchService } from './research.service';
import { RedisService } from '../redis/redis.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const RESEARCH_EVENTS_CHANNEL = 'research.events';

@Controller('research')
export class ResearchController {
  constructor(
    private researchService: ResearchService,
    private redis: RedisService,
  ) {}

  @Post('start')
  start(
    @CurrentUser('id') userId: string,
    @Body() body: { query: string; depth?: string; focus?: string },
  ) {
    return this.researchService.start(
      userId,
      body.query,
      body.depth ?? 'standard',
      body.focus ?? 'general',
    );
  }

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.researchService.findAll(userId, limit ? parseInt(limit, 10) : 20);
  }

  @Post('search')
  search(
    @CurrentUser('id') userId: string,
    @Body() body: { query: string; limit?: number },
  ) {
    return this.researchService.search(userId, body.query, body.limit ?? 10);
  }

  @Get(':id/stream')
  async stream(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res() res: FastifyReply,
  ) {
    await this.researchService.findOne(id, userId);

    const reply = res as FastifyReply;
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    reply.raw.flushHeaders();

    const unsubscribe = this.redis.subscribe(RESEARCH_EVENTS_CHANNEL, (_ch: string, message: string) => {
      try {
        const data = JSON.parse(message) as { researchId?: string; event?: string; payload?: unknown };
        if (data.researchId === id) {
          reply.raw.write(`data: ${JSON.stringify({ event: data.event, payload: data.payload })}\n\n`);
        }
      } catch {
        // ignore parse errors
      }
    });

    return new Promise<void>((resolve) => {
      reply.raw.on('close', () => {
        unsubscribe();
        resolve();
      });
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.researchService.findOne(id, userId);
  }

  @Get(':id/report')
  getReport(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.researchService.getReport(id, userId);
  }

  @Patch(':id/report')
  updateReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { content: string },
  ) {
    return this.researchService.updateReport(id, userId, body.content);
  }

  @Get(':id/logs')
  getLogs(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.researchService.getLogs(id, userId);
  }
}
