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
    const suggestions: { id: number; type: string; target: string; title: string; description: string; impact: string }[] = [];
    let nextId = 1;

    const underutilizedAgents = await this.prisma.agent.findMany({
      where: { tasks: { lt: 3 }, status: { not: 'Offline' } },
      take: 5,
      select: { name: true, tasks: true },
    });
    for (const agent of underutilizedAgents) {
      suggestions.push({
        id: nextId++,
        type: 'agent',
        target: agent.name,
        title: 'Increase utilization',
        description: `Agent "${agent.name}" has only ${agent.tasks} task(s). Consider assigning more work.`,
        impact: agent.tasks === 0 ? 'High' : 'Medium',
      });
    }

    const toolsWithExecs = await this.prisma.tool.findMany({
      where: { calls: { gt: 0 } },
      take: 10,
      select: { id: true, name: true, calls: true },
    });
    for (const tool of toolsWithExecs) {
      const failCount = await this.prisma.toolExecution.count({
        where: { toolId: tool.id, success: false },
      });
      const errorRate = failCount / tool.calls;
      if (errorRate > 0.3) {
        suggestions.push({
          id: nextId++,
          type: 'tool',
          target: tool.name,
          title: 'Improve reliability',
          description: `Tool "${tool.name}" has a ${Math.round(errorRate * 100)}% error rate across ${tool.calls} calls.`,
          impact: errorRate > 0.6 ? 'High' : 'Medium',
        });
      }
    }

    const negativeFeedback = await this.prisma.feedback.findMany({
      where: { thumbsUp: false },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { entityType: true, entityId: true },
    });
    for (const fb of negativeFeedback) {
      let entityName = fb.entityId;
      if (fb.entityType === 'agent') {
        const agent = await this.prisma.agent.findUnique({ where: { id: fb.entityId }, select: { name: true } });
        if (agent) entityName = agent.name;
      } else if (fb.entityType === 'tool') {
        const tool = await this.prisma.tool.findUnique({ where: { id: fb.entityId }, select: { name: true } });
        if (tool) entityName = tool.name;
      }
      suggestions.push({
        id: nextId++,
        type: fb.entityType,
        target: entityName,
        title: 'Review configuration',
        description: `Negative feedback received for ${fb.entityType} "${entityName}".`,
        impact: 'Low',
      });
    }

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
