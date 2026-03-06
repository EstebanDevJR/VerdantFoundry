import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAgentDto) {
    const agent = await this.prisma.agent.create({
      data: {
        name: dto.name,
        role: dto.role,
        objective: dto.objective,
        status: dto.status ?? 'Idle',
        autonomyLevel: dto.autonomyLevel ?? 50,
        configJson: (dto.configJson ?? undefined) as object | undefined,
        tools: dto.toolIds ? { create: dto.toolIds.map((toolId) => ({ toolId })) } : undefined,
        userId,
      },
      include: { tools: { include: { tool: true } } },
    });
    return this.toResponse(agent);
  }

  async findAll(userId: string) {
    const agents = await this.prisma.agent.findMany({
      where: { userId },
      include: { tools: { include: { tool: true } } },
    });
    return agents.map(this.toResponse);
  }

  async findOne(id: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId },
      include: { tools: { include: { tool: true } } },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return this.toResponse(agent);
  }

  async update(id: string, userId: string, dto: UpdateAgentDto) {
    await this.findOne(id, userId);
    const agent = await this.prisma.agent.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        objective: dto.objective,
        status: dto.status,
        autonomyLevel: dto.autonomyLevel,
        configJson: dto.configJson as object | undefined,
        tools: dto.toolIds
          ? { deleteMany: {}, create: dto.toolIds.map((toolId) => ({ toolId })) }
          : undefined,
      },
      include: { tools: { include: { tool: true } } },
    });
    return this.toResponse(agent);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.agent.delete({ where: { id } });
  }

  async getLogs(id: string, userId: string, limit = 20) {
    const agent = await this.findOne(id, userId);
    const logs = await this.prisma.researchLog.findMany({
      where: {
        research: { userId },
        agent: agent.name,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: { research: { select: { id: true, query: true } } },
    });
    return logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      agent: l.agent,
      message: l.message,
      type: l.type,
      researchId: l.research.id,
      researchQuery: l.research.query?.slice(0, 60),
    }));
  }

  async getMemory(id: string, userId: string) {
    await this.findOne(id, userId);
    const nodes = await this.prisma.memoryNode.findMany({
      where: { userId },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, type: true, tags: true, sizeBytes: true, createdAt: true },
    });
    return {
      summary: { nodeCount: nodes.length },
      recentNodes: nodes.map((n) => ({
        id: n.id,
        title: n.title,
        type: n.type,
        tags: n.tags,
        size: `${(n.sizeBytes / 1024).toFixed(1)} KB`,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  async action(id: string, userId: string, action: string) {
    const agent = await this.findOne(id, userId);
    const statusMap: Record<string, string> = {
      start: 'Active',
      pause: 'Idle',
      stop: 'Offline',
      restart: 'Active',
    };
    const newStatus = statusMap[action] ?? agent.status;
    const updated = await this.prisma.agent.update({
      where: { id },
      data: { status: newStatus },
      include: { tools: { include: { tool: true } } },
    });
    return this.toResponse(updated);
  }

  private toResponse(agent: {
    id: string;
    name: string;
    role: string;
    objective: string | null;
    status: string;
    autonomyLevel: number;
    tasks: number;
    uptime: string | null;
    tools?: { tool: { id: string; name: string; type: string } }[];
  }) {
    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      objective: agent.objective,
      status: agent.status,
      tasks: agent.tasks,
      uptime: agent.uptime ?? '100%',
      autonomyLevel: agent.autonomyLevel,
      tools: agent.tools?.map((t) => ({ id: t.tool.id, name: t.tool.name, type: t.tool.type })) ?? [],
    };
  }
}
