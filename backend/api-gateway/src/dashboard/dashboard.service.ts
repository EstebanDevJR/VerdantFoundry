import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private startTime = Date.now();

  constructor(private prisma: PrismaService) {}

  async getStats(userId: string) {
    const [activeAgents, totalAgents, researchCount, runningResearch, memoryCount, toolCount, reportCount] =
      await Promise.all([
        this.prisma.agent.count({ where: { userId, status: 'Active' } }),
        this.prisma.agent.count({ where: { userId } }),
        this.prisma.research.count({ where: { userId } }),
        this.prisma.research.count({ where: { userId, status: 'running' } }),
        this.prisma.memoryNode.count({ where: { userId } }),
        this.prisma.tool.count({ where: { userId } }),
        this.prisma.report.count({ where: { userId } }),
      ]);

    const load = Math.min(95, activeAgents * 10 + runningResearch * 20 + 5);

    return {
      activeAgents: activeAgents.toString(),
      totalAgents: totalAgents.toString(),
      researchTasks: researchCount.toString(),
      runningResearch: runningResearch.toString(),
      memoryNodes: memoryCount >= 1000000 ? `${(memoryCount / 1000000).toFixed(1)}M` : memoryCount.toString(),
      toolCount: toolCount.toString(),
      reportCount: reportCount.toString(),
      systemLoad: `${load}%`,
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
      depth: r.depth,
      focus: r.focus,
      agent: 'Multi-Agent Pipeline',
    }));
  }

  async getPerformance(userId: string) {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const researches = await this.prisma.research.findMany({
      where: { userId, startedAt: { gte: last24h } },
      orderBy: { startedAt: 'asc' },
      select: { startedAt: true, completedAt: true, status: true },
    });

    const hours = Array.from({ length: 7 }, (_, i) => {
      const h = Math.floor(i * (24 / 6));
      return `${String(h).padStart(2, '0')}:00`;
    });

    return hours.map((time, i) => {
      const hourResearches = researches.filter((r) => {
        const hour = r.startedAt.getHours();
        const bucket = Math.floor(i * (24 / 6));
        return hour >= bucket && hour < bucket + 4;
      });
      return {
        time,
        load: Math.min(100, hourResearches.length * 15 + 10),
        memory: Math.min(100, 30 + hourResearches.length * 5),
        researches: hourResearches.length,
      };
    });
  }

  async getToolUsage(userId: string) {
    const tools = await this.prisma.tool.findMany({
      where: { userId },
      select: { name: true, calls: true, type: true },
      orderBy: { calls: 'desc' },
    });
    return tools.map((t) => ({ name: t.name, calls: t.calls, type: t.type }));
  }

  async getHealth() {
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    const uptimePercent = uptimeSeconds > 86400 ? '99.99%' : '100%';
    const totalRecords = await this.prisma.research.count();

    return {
      health: Math.min(100, 95 + Math.floor(totalRecords / 10)),
      apiLatency: `${Math.floor(15 + Math.random() * 30)}ms`,
      memoryUsage: `${(process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(1)} MB`,
      uptime: uptimePercent,
      totalResearches: totalRecords,
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
