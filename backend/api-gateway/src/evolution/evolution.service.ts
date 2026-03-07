import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class EvolutionService {
  constructor(
    private prisma: PrismaService,
    private rabbitMQ: RabbitMQService,
  ) {}

  async createSimulation(userId: string, name: string, agentId: string, config?: object) {
    const sim = await this.prisma.simulation.create({
      data: {
        name,
        agentId,
        status: 'running',
        configJson: config as object | undefined,
        userId,
      },
    });
    await this.rabbitMQ.publishSimulationRun({
      simulationId: sim.id,
      agentId: sim.agentId,
      config: sim.configJson as Record<string, unknown> | undefined,
    });
    return sim;
  }

  async getSimulations(userId: string) {
    return this.prisma.simulation.findMany({
      where: { userId },
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSimulation(id: string, userId: string) {
    const sim = await this.prisma.simulation.findFirst({
      where: { id, userId },
      include: { agent: true },
    });
    if (!sim) throw new NotFoundException('Simulation not found');
    return sim;
  }

  async simulationAction(id: string, userId: string, action: string) {
    const sim = await this.getSimulation(id, userId);
    const statusMap: Record<string, string> = {
      pause: 'paused',
      resume: 'running',
      stop: 'completed',
    };
    const newStatus = statusMap[action] ?? sim.status;
    return this.prisma.simulation.update({
      where: { id },
      data: { status: newStatus },
      include: { agent: true },
    });
  }

  async getSuggestions(type?: string) {
    const suggestions = [
      {
        id: 1,
        type: 'agent',
        target: 'alpha-7',
        title: 'Increase search depth',
        description: 'Agent could benefit from deeper search iterations',
        impact: 'High',
      },
      {
        id: 2,
        type: 'tool',
        target: 'web-search',
        title: 'Add caching layer',
        description: 'Reduce latency for repeated queries',
        impact: 'Medium',
      },
    ];
    if (type) return suggestions.filter((s) => s.type === type);
    return suggestions;
  }

  async createFeedback(userId: string, entityType: string, entityId: string, thumbsUp: boolean) {
    return this.prisma.feedback.create({
      data: { entityType, entityId, thumbsUp, userId },
    });
  }

  async createExperiment(userId: string, name: string, configs: object[]) {
    return this.prisma.experiment.create({
      data: {
        name,
        status: 'draft',
        configsJson: configs as unknown as object,
        userId,
      },
    });
  }

  async getExperiments(userId: string) {
    return this.prisma.experiment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExperiment(id: string, userId: string) {
    const exp = await this.prisma.experiment.findFirst({
      where: { id, userId },
    });
    if (!exp) throw new NotFoundException('Experiment not found');
    return exp;
  }

  async runExperiment(id: string, userId: string) {
    const exp = await this.getExperiment(id, userId);
    await this.prisma.experiment.update({
      where: { id },
      data: { status: 'running' },
    });
    const variants = (exp.configsJson as unknown[]) ?? [];
    await this.rabbitMQ.publishExperimentRun({
      experimentId: id,
      variants,
    });
    return { status: 'running', message: 'Experiment started' };
  }

  async getVersions(userId: string) {
    const versions = await this.prisma.version.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        version: true,
        label: true,
        changeSummary: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return versions.map((v) => ({
      id: v.id,
      version: v.label ?? `v${v.version}.0`,
      entityType: v.entityType,
      entityId: v.entityId,
      date: v.createdAt.toISOString(),
      author: v.user?.firstName ? `${v.user.firstName} ${v.user.lastName ?? ''}`.trim() : v.user?.email ?? 'System',
      changes: v.changeSummary ?? 'No description',
    }));
  }
}
