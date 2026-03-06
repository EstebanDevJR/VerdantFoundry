import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';

export interface ResearchStartPayload {
  researchId: string;
  query: string;
  depth: string;
  focus: string;
  userId: string;
}

export interface ToolExecutePayload {
  toolId: string;
  params: Record<string, unknown>;
  requestId?: string;
}

export interface MemoryIndexPayload {
  documentId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface SimulationRunPayload {
  simulationId: string;
  agentId: string;
  config?: Record<string, unknown>;
}

export interface ExperimentRunPayload {
  experimentId: string;
  variants: unknown[];
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: ReturnType<typeof amqp.connect> | null = null;
  private channel: ChannelWrapper | null = null;
  private exchange = 'verdant.tasks';
  private readonly queues = {
    research: 'research.tasks',
    tool: 'tool.tasks',
    memory: 'memory.tasks',
    simulation: 'simulation.tasks',
    experiment: 'experiment.tasks',
  };

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('RABBITMQ_URL');
    if (!url) {
      return;
    }
    try {
      this.connection = amqp.connect([url]);
      this.channel = this.connection.createChannel({
        json: true,
        setup: async (ch) => {
          await ch.assertExchange(this.exchange, 'topic', { durable: true });
          await ch.assertQueue(this.queues.research, { durable: true });
          await ch.assertQueue(this.queues.tool, { durable: true });
          await ch.assertQueue(this.queues.memory, { durable: true });
          await ch.assertQueue(this.queues.simulation, { durable: true });
          await ch.assertQueue(this.queues.experiment, { durable: true });
          await ch.bindQueue(this.queues.research, this.exchange, 'research.start');
          await ch.bindQueue(this.queues.tool, this.exchange, 'tool.execute');
          await ch.bindQueue(this.queues.memory, this.exchange, 'memory.index');
          await ch.bindQueue(this.queues.simulation, this.exchange, 'simulation.run');
          await ch.bindQueue(this.queues.experiment, this.exchange, 'experiment.run');
        },
      });
      await this.channel.waitForConnect();
    } catch (err) {
      console.warn('RabbitMQ connection failed:', (err as Error).message);
    }
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  private async publish(routingKey: string, payload: object) {
    if (!this.channel) {
      return;
    }
    try {
      await this.channel.publish(this.exchange, routingKey, payload, { persistent: true });
    } catch (err) {
      console.error('RabbitMQ publish failed:', (err as Error).message);
    }
  }

  async publishResearchStart(payload: ResearchStartPayload) {
    await this.publish('research.start', payload);
  }

  async publishToolExecute(payload: ToolExecutePayload) {
    await this.publish('tool.execute', payload);
  }

  async publishMemoryIndex(payload: MemoryIndexPayload) {
    await this.publish('memory.index', payload);
  }

  async publishSimulationRun(payload: SimulationRunPayload) {
    await this.publish('simulation.run', payload);
  }

  async publishExperimentRun(payload: ExperimentRunPayload) {
    await this.publish('experiment.run', payload);
  }
}
