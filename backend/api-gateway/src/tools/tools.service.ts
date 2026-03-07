import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';

@Injectable()
export class ToolsService {
  private aiEngineUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.aiEngineUrl = this.config.get('AI_ENGINE_URL') || 'http://localhost:8000';
  }

  async create(userId: string, dto: CreateToolDto) {
    const tool = await this.prisma.tool.create({
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        schemaJson: (dto.schemaJson ?? undefined) as object | undefined,
        code: dto.code,
        status: dto.status ?? 'Healthy',
        userId,
      },
    });
    return this.toResponse(tool);
  }

  async findAll(userId: string) {
    const tools = await this.prisma.tool.findMany({
      where: { userId },
    });
    return tools.map(this.toResponse);
  }

  async findOne(id: string, userId: string) {
    const tool = await this.prisma.tool.findFirst({
      where: { id, userId },
    });
    if (!tool) throw new NotFoundException('Tool not found');
    return this.toResponse(tool);
  }

  async update(id: string, userId: string, dto: UpdateToolDto) {
    await this.findOne(id, userId);
    const tool = await this.prisma.tool.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        schemaJson: dto.schemaJson as object | undefined,
        code: dto.code,
        status: dto.status,
      },
    });
    return this.toResponse(tool);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.tool.delete({ where: { id } });
  }

  async execute(id: string, userId: string, params: Record<string, unknown>) {
    const tool = await this.prisma.tool.findFirst({
      where: { id, userId },
    });
    if (!tool) throw new NotFoundException('Tool not found');
    let result: { success: boolean; logs: string[]; result: unknown } = { success: false, logs: [], result: null };

    const startMs = Date.now();
    try {
      const body = {
        tool_id: id,
        name: tool.name,
        code: tool.code ?? undefined,
        schema_json: tool.schemaJson ?? undefined,
        params,
      };
      const res = await fetch(`${this.aiEngineUrl}/tools/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      result = (await res.json()) as { success: boolean; logs: string[]; result: unknown };
    } catch (e) {
      result = { success: false, logs: [`Execution failed: ${(e as Error).message}`], result: null };
    }
    const elapsedMs = Date.now() - startMs;

    await this.prisma.toolExecution.create({
      data: {
        toolId: id,
        params: params as object,
        result: result.result as object,
        logs: result.logs ?? [],
        success: result.success ?? false,
      },
    });

    const recentExecs = await this.prisma.toolExecution.findMany({
      where: { toolId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { success: true },
    });
    const totalRecent = recentExecs.length;
    const successCount = recentExecs.filter((e) => e.success).length;

    const allExecs = await this.prisma.toolExecution.count({ where: { toolId: id } });
    const allSuccessful = await this.prisma.toolExecution.count({ where: { toolId: id, success: true } });

    const rollingLatency = Math.round(
      ((tool.latencyMs ?? elapsedMs) * Math.max(0, totalRecent - 1) + elapsedMs) / totalRecent,
    );
    const successRate = allExecs > 0 ? Math.round((allSuccessful / allExecs) * 1000) / 1000 : 1;

    await this.prisma.tool.update({
      where: { id },
      data: {
        calls: { increment: 1 },
        latencyMs: rollingLatency,
        successRate,
      },
    });

    return { success: result.success, logs: result.logs, result: result.result };
  }

  async getLogs(id: string, userId: string, limit = 20) {
    await this.findOne(id, userId);
    const executions = await this.prisma.toolExecution.findMany({
      where: { toolId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return executions.map((e) => ({
      id: e.id,
      success: e.success,
      params: e.params,
      result: e.result,
      logs: e.logs,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  private toResponse(tool: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    schemaJson: unknown;
    code: string | null;
    latencyMs: number | null;
    successRate: number | null;
    status: string;
    calls: number;
  }) {
    return {
      id: tool.id,
      name: tool.name,
      type: tool.type,
      description: tool.description,
      schemaJson: tool.schemaJson,
      code: tool.code,
      latency: tool.latencyMs ? `${tool.latencyMs}ms` : 'N/A',
      successRate: tool.successRate != null ? `${(tool.successRate * 100).toFixed(1)}%` : 'N/A',
      status: tool.status,
      calls: tool.calls.toString(),
    };
  }
}
