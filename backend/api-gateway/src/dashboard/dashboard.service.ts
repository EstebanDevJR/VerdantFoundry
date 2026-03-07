import * as os from 'os';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private startTime = Date.now();
  private latencySamples: number[] = [];
  private readonly MAX_SAMPLES = 200;

  constructor(private prisma: PrismaService) {}

  recordLatency(ms: number) {
    this.latencySamples.push(ms);
    if (this.latencySamples.length > this.MAX_SAMPLES) {
      this.latencySamples = this.latencySamples.slice(-this.MAX_SAMPLES);
    }
  }

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

    const cpuLoad = Math.min(100, Math.round((os.loadavg()[0] / os.cpus().length) * 100));

    return {
      activeAgents: activeAgents.toString(),
      totalAgents: totalAgents.toString(),
      researchTasks: researchCount.toString(),
      runningResearch: runningResearch.toString(),
      memoryNodes: memoryCount >= 1000000 ? `${(memoryCount / 1000000).toFixed(1)}M` : memoryCount.toString(),
      toolCount: toolCount.toString(),
      reportCount: reportCount.toString(),
      systemLoad: `${cpuLoad}%`,
    };
  }

  async getActivity(userId: string, limit = 10) {
    const researches = await this.prisma.research.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      select: { id: true, query: true, status: true, startedAt: true, depth: true, focus: true },
    });

    const researchIds = researches.map((r) => r.id);

    const latestLogs = researchIds.length > 0
      ? await this.prisma.researchLog.findMany({
          where: { researchId: { in: researchIds } },
          orderBy: { timestamp: 'desc' },
          distinct: ['researchId'],
          select: { researchId: true, agent: true },
        })
      : [];

    const agentByResearch = new Map(latestLogs.map((l) => [l.researchId, l.agent]));

    return researches.map((r) => ({
      id: r.id,
      task: r.query.slice(0, 60) + (r.query.length > 60 ? '...' : ''),
      status: r.status === 'completed' ? 'Completed' : r.status === 'failed' ? 'Failed' : 'In Progress',
      time: this.formatTimeAgo(r.startedAt),
      depth: r.depth,
      focus: r.focus,
      agent: agentByResearch.get(r.id) ?? 'System',
    }));
  }

  async getPerformance(userId: string) {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const researches = await this.prisma.research.findMany({
      where: { userId, startedAt: { gte: last24h } },
      orderBy: { startedAt: 'asc' },
      select: { startedAt: true, completedAt: true, status: true },
    });

    const heapPercent = Math.round(
      (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
    );
    const currentCpuLoad = Math.min(100, Math.round((os.loadavg()[0] / os.cpus().length) * 100));

    const hours = Array.from({ length: 7 }, (_, i) => {
      const h = Math.floor(i * (24 / 6));
      return `${String(h).padStart(2, '0')}:00`;
    });

    return hours.map((time, i) => {
      const bucket = Math.floor(i * (24 / 6));
      const hourResearches = researches.filter((r) => {
        const hour = r.startedAt.getHours();
        return hour >= bucket && hour < bucket + 4;
      });
      const bucketWeight = hourResearches.length > 0 ? Math.min(100, hourResearches.length * 8) : 0;
      return {
        time,
        load: Math.min(100, Math.round(currentCpuLoad * 0.5 + bucketWeight * 0.5)),
        memory: heapPercent,
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
    const uptimeMs = Date.now() - this.startTime;
    const uptimeHours = uptimeMs / (1000 * 60 * 60);
    const uptimeStr = uptimeHours >= 24
      ? `${(uptimeHours / 24).toFixed(1)}d`
      : `${uptimeHours.toFixed(1)}h`;

    let dbHealthy = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch {
      // DB unreachable
    }

    let healthScore = 0;
    if (dbHealthy) healthScore += 50;
    if (uptimeMs > 60_000) healthScore += 25;
    if (uptimeMs > 600_000) healthScore += 15;
    healthScore += 10; // service is responding

    const p50 = this.computeP50();

    return {
      health: Math.min(100, healthScore),
      apiLatency: p50 !== null ? `${p50}ms` : 'N/A',
      memoryUsage: `${(process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(1)} MB`,
      uptime: uptimeStr,
      totalResearches: await this.prisma.research.count(),
    };
  }

  private computeP50(): number | null {
    if (this.latencySamples.length === 0) return null;
    const sorted = [...this.latencySamples].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  }

  private formatTimeAgo(date: Date) {
    const sec = (Date.now() - date.getTime()) / 1000;
    if (sec < 60) return 'just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  }
}
