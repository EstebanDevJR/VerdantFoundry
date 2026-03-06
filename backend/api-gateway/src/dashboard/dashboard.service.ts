import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string) {
    const [activeAgents, researchCount, memoryCount] = await Promise.all([
      this.prisma.agent.count({ where: { userId, status: 'Active' } }),
      this.prisma.research.count({ where: { userId } }),
      this.prisma.memoryNode.count({ where: { userId } }),
    ]);

    return {
      activeAgents: activeAgents.toString(),
      researchTasks: researchCount.toString(),
      memoryNodes: memoryCount >= 1000000 ? `${(memoryCount / 1000000).toFixed(1)}M` : memoryCount.toString(),
      systemLoad: Math.floor(Math.random() * 30 + 20).toString() + '%',
    };
  }

  async getActivity(userId: string, limit = 10) {
    const researches = await this.prisma.research.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return researches.map((r) => ({
      id: r.id,
      task: r.query.slice(0, 60) + (r.query.length > 60 ? '...' : ''),
      status: r.status === 'completed' ? 'Completed' : r.status === 'failed' ? 'Failed' : 'In Progress',
      time: this.formatTimeAgo(r.startedAt),
      agent: 'Alpha-7',
    }));
  }

  async getPerformance(period = '24h') {
    const points = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
    return points.map((time, i) => ({
      time,
      load: 30 + i * 10 + Math.floor(Math.random() * 10),
      memory: 40 + i * 5 + Math.floor(Math.random() * 5),
    }));
  }

  async getToolUsage(userId: string) {
    const tools = await this.prisma.tool.findMany({
      where: { userId },
      select: { name: true, calls: true },
    });
    return tools.map((t) => ({ name: t.name, calls: t.calls }));
  }

  async getHealth() {
    return {
      health: 98,
      apiLatency: '42ms',
      memoryUsage: '4.2 GB',
      uptime: '99.99%',
    };
  }

  private formatTimeAgo(date: Date) {
    const sec = (Date.now() - date.getTime()) / 1000;
    if (sec < 60) return 'just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  }
}
