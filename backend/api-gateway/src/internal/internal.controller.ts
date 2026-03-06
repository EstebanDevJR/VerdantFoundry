import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Public } from '../auth/decorators/public.decorator';
import { InternalGuard } from './internal.guard';

const RESEARCH_EVENTS_CHANNEL = 'research.events';

@Controller('internal')
@Public()
@UseGuards(InternalGuard)
export class InternalController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Post('research/:id/log')
  async appendResearchLog(
    @Param('id') id: string,
    @Body() body: { agent: string; message: string; type: string },
  ) {
    await this.prisma.researchLog.create({
      data: {
        researchId: id,
        agent: body.agent ?? 'System',
        message: body.message ?? '',
        type: body.type ?? 'info',
      },
    });
    const payload = {
      researchId: id,
      event: 'log',
      payload: {
        agent: body.agent ?? 'System',
        message: body.message ?? '',
        type: body.type ?? 'info',
      },
    };
    await this.redis.publish(RESEARCH_EVENTS_CHANNEL, JSON.stringify(payload));
    return { ok: true };
  }

  @Post('research/:id/reasoning')
  async publishResearchReasoning(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const payload = {
      researchId: id,
      event: 'reasoning',
      payload: body,
    };
    await this.redis.publish(RESEARCH_EVENTS_CHANNEL, JSON.stringify(payload));
    return { ok: true };
  }

  @Post('research/:id/timeline')
  async publishResearchTimeline(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const payload = {
      researchId: id,
      event: 'timeline',
      payload: body,
    };
    await this.redis.publish(RESEARCH_EVENTS_CHANNEL, JSON.stringify(payload));
    return { ok: true };
  }

  @Patch('research/:id/complete')
  async completeResearch(
    @Param('id') id: string,
    @Body() body: { reportContent: string; status?: string },
  ) {
    await this.prisma.research.update({
      where: { id },
      data: {
        reportContent: body.reportContent,
        status: body.status ?? 'completed',
        completedAt: new Date(),
      },
    });
    return { ok: true };
  }

  @Patch('research/:id/fail')
  async failResearch(@Param('id') id: string, @Body() body: { message?: string }) {
    await this.prisma.research.update({
      where: { id },
      data: { status: 'failed', completedAt: new Date() },
    });
    return { ok: true };
  }

  @Patch('simulations/:id')
  async updateSimulation(
    @Param('id') id: string,
    @Body() body: { progress?: number; status?: string },
  ) {
    await this.prisma.simulation.update({
      where: { id },
      data: {
        ...(body.progress !== undefined && { progress: body.progress }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });
    return { ok: true };
  }

  @Patch('experiments/:id')
  async updateExperiment(
    @Param('id') id: string,
    @Body() body: { metricsJson?: object; status?: string },
  ) {
    await this.prisma.experiment.update({
      where: { id },
      data: {
        ...(body.metricsJson !== undefined && { metricsJson: body.metricsJson }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });
    return { ok: true };
  }
}
