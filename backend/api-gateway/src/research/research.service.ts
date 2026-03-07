import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { VersioningService } from '../versioning/versioning.service';

@Injectable()
export class ResearchService {
  private aiEngineUrl: string;

  constructor(
    private prisma: PrismaService,
    private rabbitMQ: RabbitMQService,
    private versioningService: VersioningService,
    private config: ConfigService,
  ) {
    this.aiEngineUrl = this.config.get('AI_ENGINE_URL') || process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';
  }

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
        message: `Initializing ${depth} multi-agent research protocol with ${focus} focus...`,
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

  async findAll(userId: string, limit = 20) {
    const list = await this.prisma.research.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
    return list.map((r) => ({
      id: r.id,
      query: r.query,
      depth: r.depth,
      focus: r.focus,
      status: r.status,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
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

  async updateReport(id: string, userId: string, content: string) {
    const research = await this.findOne(id, userId);

    await this.versioningService.createVersion(
      userId,
      'research',
      id,
      { query: research.query, reportContent: research.reportContent, status: research.status },
      'Report content updated',
    );

    const updated = await this.prisma.research.update({
      where: { id },
      data: { reportContent: content },
    });

    this.indexResearchInVectorStore(id, content, research.query).catch(() => {});

    return { content: updated.reportContent ?? '', metadata: updated.reportMetadata };
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

  async search(userId: string, query: string, limit = 10) {
    const userResearches = await this.prisma.research.findMany({
      where: { userId, status: 'completed' },
      select: { id: true },
    });

    try {
      const res = await fetch(`${this.aiEngineUrl}/memory/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          document_ids: userResearches.map((r) => `research_${r.id}`),
          limit,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { results?: Array<{ content: string; document_id?: string; score?: number }> };
        const results = data.results ?? [];
        const researchIds = [...new Set(
          results.map((r) => r.document_id?.replace('research_', '')).filter(Boolean),
        )] as string[];
        if (researchIds.length > 0) {
          const researches = await this.prisma.research.findMany({
            where: { id: { in: researchIds }, userId },
          });
          const researchMap = new Map(researches.map((r) => [r.id, r]));
          return results.map((r) => {
            const rid = r.document_id?.replace('research_', '') ?? '';
            const research = researchMap.get(rid);
            return {
              id: rid,
              query: research?.query ?? '',
              content: r.content,
              score: r.score,
              status: research?.status ?? 'unknown',
              startedAt: research?.startedAt,
            };
          });
        }
      }
    } catch {
      // fall through to keyword search
    }

    const researches = await this.prisma.research.findMany({
      where: {
        userId,
        status: 'completed',
        OR: [
          { query: { contains: query, mode: 'insensitive' } },
          { reportContent: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { startedAt: 'desc' },
    });
    return researches.map((r) => ({
      id: r.id,
      query: r.query,
      content: (r.reportContent ?? '').slice(0, 300),
      score: null,
      status: r.status,
      startedAt: r.startedAt,
    }));
  }

  private async indexResearchInVectorStore(researchId: string, content: string, query: string) {
    try {
      await fetch(`${this.aiEngineUrl}/memory/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: `research_${researchId}`,
          content: `Research Query: ${query}\n\n${content}`,
          metadata: { type: 'research', query },
        }),
      });
    } catch {
      // best effort indexing
    }
  }
}
