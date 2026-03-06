import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class ResearchService {
  constructor(
    private prisma: PrismaService,
    private rabbitMQ: RabbitMQService,
  ) {}

  async start(userId: string, query: string, depth = 'standard', focus = 'general') {
    const research = await this.prisma.research.create({
      data: {
        query,
        depth,
        focus,
        status: 'running',
        userId,
      },
    });
    await this.prisma.researchLog.create({
      data: {
        researchId: research.id,
        agent: 'System',
        message: `Initializing ${depth} research protocol with ${focus} focus...`,
        type: 'info',
      },
    });
    await this.rabbitMQ.publishResearchStart({
      researchId: research.id,
      query,
      depth,
      focus,
      userId,
    });
    return { id: research.id, status: 'running' };
  }

  async findAll(userId: string) {
    const list = await this.prisma.research.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
    return list.map((r) => ({
      id: r.id,
      query: r.query,
      status: r.status,
      startedAt: r.startedAt,
    }));
  }

  async findOne(id: string, userId: string) {
    const research = await this.prisma.research.findFirst({
      where: { id, userId },
    });
    if (!research) throw new NotFoundException('Research not found');
    return research;
  }

  async getReport(id: string, userId: string) {
    const research = await this.findOne(id, userId);
    return {
      content: research.reportContent ?? '',
      metadata: research.reportMetadata,
    };
  }

  async getLogs(id: string, userId: string) {
    await this.findOne(id, userId);
    const logs = await this.prisma.researchLog.findMany({
      where: { researchId: id },
      orderBy: { timestamp: 'asc' },
    });
    return logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      agent: l.agent,
      message: l.message,
      type: l.type,
    }));
  }
}
