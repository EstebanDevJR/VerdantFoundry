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

type WebSocketClient = WebSocket & {
  researchId?: string;
  channel?: 'dashboard' | 'kernel' | 'agent';
  agentId?: string;
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
  private dashboardInterval: ReturnType<typeof setInterval> | null = null;
  private kernelInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private redis: RedisService) {}

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

    this.dashboardInterval = setInterval(() => {
      if (this.dashboardClients.size === 0) return;
      const payload = {
        activeAgents: String(Math.floor(Math.random() * 5) + 1),
        researchTasks: String(Math.floor(Math.random() * 3)),
        memoryNodes: String(Math.floor(Math.random() * 100)),
        systemLoad: `${Math.floor(Math.random() * 20 + 20)}%`,
      };
      this.broadcastToSet(this.dashboardClients, 'metrics', payload);
    }, 5000);

    this.kernelInterval = setInterval(() => {
      if (this.kernelClients.size === 0) return;
      const payload = {
        level: 'INFO',
        source: 'kernel',
        message: `Heartbeat ${new Date().toISOString()}`,
      };
      this.broadcastToSet(this.kernelClients, 'logs', payload);
    }, 10000);
  }

  handleConnection(client: WebSocketClient) {
    this.logger.debug('Client connected');
  }

  handleDisconnect(client: WebSocketClient) {
    const researchId = client.researchId;
    if (researchId) {
      const set = this.researchClients.get(researchId);
      if (set) {
        set.delete(client);
        if (set.size === 0) this.researchClients.delete(researchId);
      }
    }
    this.dashboardClients.delete(client);
    this.kernelClients.delete(client);
    if (client.agentId) {
      const set = this.agentClients.get(client.agentId);
      if (set) {
        set.delete(client);
        if (set.size === 0) this.agentClients.delete(client.agentId);
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
    const statusPayload = { agentId, status: 'Idle', tasks: 0, uptime: '100%' };
    this.broadcastToSet(set, 'status', statusPayload);
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

  broadcastToResearch(researchId: string, event: string, payload: unknown) {
    this.emitToResearch(researchId, event, payload);
  }
}
