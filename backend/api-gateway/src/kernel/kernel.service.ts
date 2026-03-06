import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KernelService {
  private kernelState: 'running' | 'paused' | 'stopped' = 'running';

  constructor(private prisma: PrismaService) {}

  getMetrics(userId: string) {
    return this.prisma.agent.findMany({
      where: { userId },
      select: { id: true, name: true, role: true, status: true, tasks: true, uptime: true },
    }).then((agents) => {
      const activeCount = agents.filter((a) => a.status === 'Active').length;
      const totalTasks = agents.reduce((sum, a) => sum + a.tasks, 0);
      return {
        activeAgents: activeCount,
        totalTasks,
        memoryNodes: 0,
        cpuLoad: Math.floor(Math.random() * 30 + 20),
        memoryUsage: Math.floor(Math.random() * 30 + 40),
      };
    });
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

  getLogs(limit = 50) {
    const levels = ['INFO', 'WARN', 'ERROR'];
    const sources = ['kernel', 'scheduler', 'agent-manager', 'memory'];
    const logs = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      time: new Date(Date.now() - i * 60000).toISOString(),
      level: levels[i % 3],
      source: sources[i % sources.length],
      message: `Log entry ${20 - i}`,
    }));
    return logs;
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

  getFilesystem() {
    return {
      folders: [
        { name: 'agents', icon: 'folder', items: 12, size: '2.4 MB', date: '2h ago' },
        { name: 'logs', icon: 'folder', items: 48, size: '156 MB', date: '1h ago' },
        { name: 'memory', icon: 'folder', items: 1240, size: '4.2 GB', date: '30m ago' },
      ],
      files: [
        { name: 'config.json', type: 'json', size: '12 KB', date: '1d ago' },
        { name: 'kernel.log', type: 'text', size: '2.1 MB', date: '1h ago' },
      ],
    };
  }
}
