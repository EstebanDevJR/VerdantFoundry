import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

type WebSocketClient = WebSocket & {
  researchId?: string;
  channel?: 'dashboard' | 'kernel' | 'agent' | 'report' | 'evolution';
  agentId?: string;
  reportId?: string;
};

@WebSocketGateway({ path: '/ws', cors: { origin: '*' } })
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private researchClients = new Map<string, Set<WebSocket>>();
  private dashboardClients = new Set<WebSocket>();
  private kernelClients = new Set<WebSocket>();
  private agentClients = new Map<string, Set<WebSocket>>();
  private reportClients = new Map<string, Set<WebSocket>>();
  private evolutionClients = new Set<WebSocket>();
  private dashboardInterval: ReturnType<typeof setInterval> | null = null;
  private kernelInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  afterInit() {
    this.redis.subscribe('research.events', (_ch, message) => {
      try {
        const data = JSON.parse(message);
        const { researchId, event, payload } = data;
        if (researchId) {
          this.emitToResearch(researchId, event, payload);
        }
      } catch {
        // ignore parse errors
      }
    });

    this.redis.subscribe('report.events', (_ch, message) => {
      try {
        const data = JSON.parse(message);
        const { reportId, event, payload } = data;
        if (reportId) {
          this.emitToReport(reportId, event, payload);
        }
      } catch {
        // ignore parse errors
      }
    });

    this.redis.subscribe('evolution.events', (_ch, message) => {
      try {
        const data = JSON.parse(message);
        this.broadcastToSet(this.evolutionClients, data.event ?? 'update', data.payload ?? data);
      } catch {
        // ignore parse errors
      }
    });

    this.dashboardInterval = setInterval(async () => {
      if (this.dashboardClients.size === 0) return;
      try {
        const [agentCount, researchCount, memoryCount, runningResearch] = await Promise.all([
          this.prisma.agent.count({ where: { status: 'Active' } }),
          this.prisma.research.count(),
          this.prisma.memoryNode.count(),
          this.prisma.research.count({ where: { status: 'running' } }),
        ]);
        const payload = {
          activeAgents: String(agentCount),
          researchTasks: String(runningResearch),
          memoryNodes: String(memoryCount),
          systemLoad: `${Math.min(95, Math.max(5, agentCount * 8 + runningResearch * 15 + Math.floor(Math.random() * 5)))}%`,
        };
        this.broadcastToSet(this.dashboardClients, 'metrics', payload);
      } catch {
        // fallback if db not available
      }
    }, 5000);

    this.kernelInterval = setInterval(async () => {
      if (this.kernelClients.size === 0) return;
      try {
        const [agentMetrics, recentResearch] = await Promise.all([
          this.prisma.agent.aggregate({ _count: true, _sum: { tasks: true } }),
          this.prisma.research.findFirst({ orderBy: { startedAt: 'desc' }, select: { query: true, status: true } }),
        ]);
        const payload = {
          level: 'INFO',
          source: 'kernel',
          message: recentResearch
            ? `Active agents: ${agentMetrics._count}, Tasks: ${agentMetrics._sum.tasks ?? 0}, Latest: "${recentResearch.query.slice(0, 40)}..." (${recentResearch.status})`
            : `System heartbeat - ${agentMetrics._count} agents, ${agentMetrics._sum.tasks ?? 0} tasks`,
          timestamp: new Date().toISOString(),
        };
        this.broadcastToSet(this.kernelClients, 'logs', payload);
      } catch {
        const payload = {
          level: 'INFO',
          source: 'kernel',
          message: `Heartbeat ${new Date().toISOString()}`,
          timestamp: new Date().toISOString(),
        };
        this.broadcastToSet(this.kernelClients, 'logs', payload);
      }
    }, 10000);
  }

  handleConnection(client: WebSocketClient) {
    this.logger.debug('Client connected');
  }

  handleDisconnect(client: WebSocketClient) {
    if (client.researchId) {
      const set = this.researchClients.get(client.researchId);
      if (set) {
        set.delete(client);
        if (set.size === 0) this.researchClients.delete(client.researchId);
      }
    }
    this.dashboardClients.delete(client);
    this.kernelClients.delete(client);
    this.evolutionClients.delete(client);
    if (client.agentId) {
      const set = this.agentClients.get(client.agentId);
      if (set) {
        set.delete(client);
        if (set.size === 0) this.agentClients.delete(client.agentId);
      }
    }
    if (client.reportId) {
      const set = this.reportClients.get(client.reportId);
      if (set) {
        set.delete(client);
        if (set.size === 0) this.reportClients.delete(client.reportId);
      }
    }
  }

  @SubscribeMessage('subscribe-research')
  handleSubscribeResearch(client: WebSocketClient, payload: string | { researchId?: string }) {
    const researchId = typeof payload === 'string' ? payload : payload?.researchId;
    if (!researchId) return;
    let set = this.researchClients.get(researchId);
    if (!set) {
      set = new Set();
      this.researchClients.set(researchId, set);
    }
    set.add(client);
    client.researchId = researchId;
  }

  @SubscribeMessage('subscribe-dashboard')
  handleSubscribeDashboard(client: WebSocketClient) {
    this.dashboardClients.add(client);
    client.channel = 'dashboard';
  }

  @SubscribeMessage('subscribe-kernel')
  handleSubscribeKernel(client: WebSocketClient) {
    this.kernelClients.add(client);
    client.channel = 'kernel';
  }

  @SubscribeMessage('subscribe-agent')
  handleSubscribeAgent(client: WebSocketClient, payload: string | { agentId?: string }) {
    const agentId = typeof payload === 'string' ? payload : payload?.agentId;
    if (!agentId) return;
    let set = this.agentClients.get(agentId);
    if (!set) {
      set = new Set();
      this.agentClients.set(agentId, set);
    }
    set.add(client);
    client.channel = 'agent';
    client.agentId = agentId;
    this.prisma.agent.findFirst({ where: { id: agentId } }).then((agent) => {
      if (agent) {
        this.broadcastToSet(set!, 'status', {
          agentId,
          status: agent.status,
          tasks: agent.tasks,
          uptime: agent.uptime,
        });
      }
    }).catch(() => {});
  }

  @SubscribeMessage('subscribe-report')
  handleSubscribeReport(client: WebSocketClient, payload: string | { reportId?: string }) {
    const reportId = typeof payload === 'string' ? payload : payload?.reportId;
    if (!reportId) return;
    let set = this.reportClients.get(reportId);
    if (!set) {
      set = new Set();
      this.reportClients.set(reportId, set);
    }
    set.add(client);
    client.reportId = reportId;
    client.channel = 'report';
  }

  @SubscribeMessage('subscribe-evolution')
  handleSubscribeEvolution(client: WebSocketClient) {
    this.evolutionClients.add(client);
    client.channel = 'evolution';
  }

  private broadcastToSet(set: Set<WebSocket>, event: string, payload: unknown) {
    const msg = JSON.stringify({ event, payload });
    set.forEach((ws) => {
      if (ws.readyState === 1) ws.send(msg);
    });
  }

  private emitToResearch(researchId: string, event: string, payload: unknown) {
    const set = this.researchClients.get(researchId);
    if (!set) return;
    this.broadcastToSet(set, event, payload);
  }

  private emitToReport(reportId: string, event: string, payload: unknown) {
    const set = this.reportClients.get(reportId);
    if (!set) return;
    this.broadcastToSet(set, event, payload);
  }

  broadcastToResearch(researchId: string, event: string, payload: unknown) {
    this.emitToResearch(researchId, event, payload);
  }

  broadcastToReport(reportId: string, event: string, payload: unknown) {
    this.emitToReport(reportId, event, payload);
  }

  broadcastToEvolution(event: string, payload: unknown) {
    this.broadcastToSet(this.evolutionClients, event, payload);
  }
}
