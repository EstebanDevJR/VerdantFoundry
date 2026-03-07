import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KernelService {
  private kernelState: 'running' | 'paused' | 'stopped' = 'running';

  constructor(private prisma: PrismaService) {}

  async getMetrics(userId: string) {
    const [agents, memoryCount, runningResearch, toolExecs] = await Promise.all([
      this.prisma.agent.findMany({
        where: { userId },
        select: { status: true, tasks: true },
      }),
      this.prisma.memoryNode.count({ where: { userId } }),
      this.prisma.research.count({ where: { userId, status: 'running' } }),
      this.prisma.toolExecution.count(),
    ]);

    const activeCount = agents.filter((a) => a.status === 'Active').length;
    const totalTasks = agents.reduce((sum, a) => sum + a.tasks, 0);
    const memUsage = process.memoryUsage();

    return {
      activeAgents: activeCount,
      totalAgents: agents.length,
      totalTasks,
      memoryNodes: memoryCount,
      runningResearch,
      toolExecutions: toolExecs,
      cpuLoad: Math.min(95, activeCount * 12 + runningResearch * 20 + 5),
      memoryUsage: Math.round(memUsage.heapUsed / (1024 * 1024)),
      memoryTotal: Math.round(memUsage.heapTotal / (1024 * 1024)),
    };
  }

  getState() {
    return { state: this.kernelState };
  }

  setState(state: 'running' | 'paused' | 'stopped') {
    this.kernelState = state;
    return { state: this.kernelState };
  }

  async getProcesses(userId: string) {
    const agents = await this.prisma.agent.findMany({
      where: { userId },
    });
    return agents.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      status: a.status.toLowerCase() === 'active' ? 'running' : a.status.toLowerCase() === 'idle' ? 'paused' : 'queued',
      cpu: Math.floor(Math.random() * 30),
      mem: Math.floor(Math.random() * 500),
      time: '00:00:00',
      priority: 5,
    }));
  }

  async processAction(processId: string, userId: string, action: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: processId, userId },
    });
    if (!agent) return null;

    const statusMap: Record<string, string> = {
      start: 'Active',
      pause: 'Idle',
      stop: 'Offline',
      restart: 'Active',
    };
    const newStatus = statusMap[action] ?? agent.status;

    await this.prisma.agent.update({
      where: { id: processId },
      data: { status: newStatus },
    });
    return { id: processId, status: newStatus };
  }

  async getLogs(userId: string, limit = 50) {
    const recentLogs = await this.prisma.researchLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 100),
      include: { research: { select: { userId: true, query: true } } },
    });

    const kernelLogs = recentLogs
      .filter((l) => l.research.userId === userId)
      .map((l) => ({
        time: l.timestamp.toISOString(),
        level: l.type === 'error' ? 'ERROR' : l.type === 'success' ? 'INFO' : l.type === 'action' ? 'WARN' : 'INFO',
        source: l.agent.toLowerCase() === 'system' ? 'kernel' : `agent:${l.agent}`,
        message: l.message,
        researchQuery: l.research.query.slice(0, 50),
      }));

    if (kernelLogs.length < 5) {
      kernelLogs.push(
        { time: new Date().toISOString(), level: 'INFO', source: 'kernel', message: 'System initialized', researchQuery: '' },
        { time: new Date(Date.now() - 60000).toISOString(), level: 'INFO', source: 'scheduler', message: 'Agent scheduler active', researchQuery: '' },
      );
    }

    return kernelLogs;
  }

  getNetwork(userId: string) {
    return this.prisma.agent.findMany({
      where: { userId },
      select: { id: true, name: true, role: true },
    }).then((agents) => {
      const nodes = agents.map((a, i) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        type: 'agent',
        x: 100 + (i % 3) * 200,
        y: 100 + Math.floor(i / 3) * 150,
      }));
      const edges = agents.slice(0, -1).map((a, i) => ({
        source: a.id,
        target: agents[i + 1]?.id ?? agents[0].id,
        type: 'message',
        status: i % 2 === 0 ? 'active' : 'idle',
      }));
      return { nodes, edges };
    });
  }

  async getFilesystem(userId: string) {
    const [agentCount, memoryStats, researchCount, toolCount, reportCount] = await Promise.all([
      this.prisma.agent.count({ where: { userId } }),
      this.prisma.memoryNode.aggregate({
        where: { userId },
        _count: true,
        _sum: { sizeBytes: true },
      }),
      this.prisma.research.count({ where: { userId } }),
      this.prisma.tool.count({ where: { userId } }),
      this.prisma.report.count({ where: { userId } }),
    ]);

    const memSize = memoryStats._sum.sizeBytes ?? 0;
    const memSizeStr = memSize > 1024 * 1024 * 1024
      ? `${(memSize / (1024 * 1024 * 1024)).toFixed(1)} GB`
      : memSize > 1024 * 1024
        ? `${(memSize / (1024 * 1024)).toFixed(1)} MB`
        : `${(memSize / 1024).toFixed(1)} KB`;

    return {
      folders: [
        { name: 'agents', icon: 'folder', items: agentCount, size: `${agentCount * 2.4} KB`, date: 'live' },
        { name: 'research', icon: 'folder', items: researchCount, size: `${researchCount * 12} KB`, date: 'live' },
        { name: 'memory', icon: 'folder', items: memoryStats._count, size: memSizeStr, date: 'live' },
        { name: 'tools', icon: 'folder', items: toolCount, size: `${toolCount * 4} KB`, date: 'live' },
        { name: 'reports', icon: 'folder', items: reportCount, size: `${reportCount * 8} KB`, date: 'live' },
      ],
      files: [
        { name: 'config.json', type: 'json', size: '12 KB', date: 'system' },
        { name: 'kernel.log', type: 'text', size: 'streaming', date: 'live' },
        { name: 'vector_index.qdrant', type: 'binary', size: memSizeStr, date: 'synced' },
      ],
    };
  }
}
