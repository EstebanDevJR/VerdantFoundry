import * as os from 'os';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class KernelService {
  private kernelState: 'running' | 'paused' | 'stopped' = 'running';
  private readonly REDIS_STATE_KEY = 'kernel:state';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    this.loadStateFromRedis();
  }

  private async loadStateFromRedis() {
    try {
      const saved = await this.redis.get(this.REDIS_STATE_KEY);
      if (saved === 'running' || saved === 'paused' || saved === 'stopped') {
        this.kernelState = saved;
      }
    } catch {
      // Redis unavailable; keep in-memory default
    }
  }

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
    const cpuLoad = Math.min(100, Math.round((os.loadavg()[0] / os.cpus().length) * 100));

    return {
      activeAgents: activeCount,
      totalAgents: agents.length,
      totalTasks,
      memoryNodes: memoryCount,
      runningResearch,
      toolExecutions: toolExecs,
      cpuLoad,
      memoryUsage: Math.round(memUsage.heapUsed / (1024 * 1024)),
      memoryTotal: Math.round(memUsage.heapTotal / (1024 * 1024)),
    };
  }

  getState() {
    return { state: this.kernelState };
  }

  async setState(state: 'running' | 'paused' | 'stopped') {
    this.kernelState = state;
    try {
      await this.redis.set(this.REDIS_STATE_KEY, state);
    } catch {
      // Redis unavailable; state persisted only in memory
    }
    return { state: this.kernelState };
  }

  async getProcesses(userId: string) {
    const agents = await this.prisma.agent.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        tasks: true,
        configJson: true,
        createdAt: true,
      },
    });

    const totalTasks = agents.reduce((sum, a) => sum + a.tasks, 0) || 1;

    return agents.map((a) => {
      const cpuShare = Math.round((a.tasks / totalTasks) * 100);
      const configSize = a.configJson ? Buffer.byteLength(JSON.stringify(a.configJson), 'utf8') : 0;
      const memKB = Math.round(configSize / 1024 * 10) / 10;

      return {
        id: a.id,
        name: a.name,
        role: a.role,
        status: a.status.toLowerCase() === 'active' ? 'running' : a.status.toLowerCase() === 'idle' ? 'paused' : 'queued',
        cpu: cpuShare,
        mem: memKB,
        time: this.formatDuration(Date.now() - a.createdAt.getTime()),
        priority: 5,
      };
    });
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

    return recentLogs
      .filter((l) => l.research.userId === userId)
      .map((l) => ({
        time: l.timestamp.toISOString(),
        level: l.type === 'error' ? 'ERROR' : l.type === 'success' ? 'INFO' : l.type === 'action' ? 'WARN' : 'INFO',
        source: l.agent.toLowerCase() === 'system' ? 'kernel' : `agent:${l.agent}`,
        message: l.message,
        researchQuery: l.research.query.slice(0, 50),
      }));
  }

  async getNetwork(userId: string) {
    const agents = await this.prisma.agent.findMany({
      where: { userId },
      select: { id: true, name: true, role: true },
    });

    if (agents.length === 0) return { nodes: [], edges: [] };

    const radius = Math.max(150, agents.length * 40);
    const nodes = agents.map((a, i) => {
      const angle = (2 * Math.PI * i) / agents.length;
      return {
        id: a.id,
        name: a.name,
        role: a.role,
        type: 'agent',
        x: Math.round(400 + radius * Math.cos(angle)),
        y: Math.round(300 + radius * Math.sin(angle)),
      };
    });

    const agentIds = agents.map((a) => a.id);
    const agentNames = agents.map((a) => a.name);

    const sharedLogs = await this.prisma.researchLog.findMany({
      where: { agent: { in: agentNames } },
      select: { agent: true, researchId: true },
    });

    const researchAgentMap = new Map<string, Set<string>>();
    for (const log of sharedLogs) {
      if (!researchAgentMap.has(log.researchId)) {
        researchAgentMap.set(log.researchId, new Set());
      }
      researchAgentMap.get(log.researchId)!.add(log.agent);
    }

    const nameToId = new Map(agents.map((a) => [a.name, a.id]));
    const edgeSet = new Set<string>();
    const edges: { source: string; target: string; type: string; status: string }[] = [];

    for (const [, agentNameSet] of researchAgentMap) {
      const participatingIds = [...agentNameSet]
        .map((name) => nameToId.get(name))
        .filter((id): id is string => id !== undefined);

      for (let i = 0; i < participatingIds.length; i++) {
        for (let j = i + 1; j < participatingIds.length; j++) {
          const key = [participatingIds[i], participatingIds[j]].sort().join(':');
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push({
              source: participatingIds[i],
              target: participatingIds[j],
              type: 'message',
              status: 'active',
            });
          }
        }
      }
    }

    if (edges.length === 0 && agents.length > 1) {
      for (let i = 0; i < agents.length - 1; i++) {
        edges.push({
          source: agentIds[i],
          target: agentIds[i + 1],
          type: 'message',
          status: 'idle',
        });
      }
    }

    return { nodes, edges };
  }

  async getFilesystem(userId: string) {
    const [agentData, memoryStats, researchData, toolData, reportData] = await Promise.all([
      this.prisma.agent.findMany({
        where: { userId },
        select: { configJson: true },
      }),
      this.prisma.memoryNode.aggregate({
        where: { userId },
        _count: true,
        _sum: { sizeBytes: true },
      }),
      this.prisma.research.findMany({
        where: { userId },
        select: { reportContent: true },
      }),
      this.prisma.tool.findMany({
        where: { userId },
        select: { code: true, schemaJson: true },
      }),
      this.prisma.report.findMany({
        where: { userId },
        select: { blocks: true },
      }),
    ]);

    const agentSize = agentData.reduce((sum, a) => {
      return sum + (a.configJson ? Buffer.byteLength(JSON.stringify(a.configJson), 'utf8') : 128);
    }, 0);

    const memSize = memoryStats._sum.sizeBytes ?? 0;

    const researchSize = researchData.reduce((sum, r) => {
      return sum + (r.reportContent ? Buffer.byteLength(r.reportContent, 'utf8') : 256);
    }, 0);

    const toolSize = toolData.reduce((sum, t) => {
      const codeLen = t.code ? Buffer.byteLength(t.code, 'utf8') : 0;
      const schemaLen = t.schemaJson ? Buffer.byteLength(JSON.stringify(t.schemaJson), 'utf8') : 0;
      return sum + codeLen + schemaLen;
    }, 0);

    const reportSize = reportData.reduce((sum, r) => {
      return sum + (r.blocks ? Buffer.byteLength(JSON.stringify(r.blocks), 'utf8') : 0);
    }, 0);

    return {
      folders: [
        { name: 'agents', icon: 'folder', items: agentData.length, size: this.formatSize(agentSize), date: 'live' },
        { name: 'research', icon: 'folder', items: researchData.length, size: this.formatSize(researchSize), date: 'live' },
        { name: 'memory', icon: 'folder', items: memoryStats._count, size: this.formatSize(memSize), date: 'live' },
        { name: 'tools', icon: 'folder', items: toolData.length, size: this.formatSize(toolSize), date: 'live' },
        { name: 'reports', icon: 'folder', items: reportData.length, size: this.formatSize(reportSize), date: 'live' },
      ],
      files: [
        { name: 'config.json', type: 'json', size: '12 KB', date: 'system' },
        { name: 'kernel.log', type: 'text', size: 'streaming', date: 'live' },
        { name: 'vector_index.qdrant', type: 'binary', size: this.formatSize(memSize), date: 'synced' },
      ],
    };
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  }
}
