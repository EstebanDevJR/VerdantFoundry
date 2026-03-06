import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class MemoryService {
  private aiEngineUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private rabbitMQ: RabbitMQService,
  ) {
    this.aiEngineUrl = this.config.get('AI_ENGINE_URL') || 'http://localhost:8000';
  }

  async createDocument(userId: string, data: { title: string; type: string; content: string; tags?: string[] }) {
    const sizeBytes = Buffer.byteLength(data.content, 'utf8');
    const node = await this.prisma.memoryNode.create({
      data: {
        title: data.title,
        type: data.type,
        content: data.content,
        sizeBytes,
        tags: data.tags ?? [],
        userId,
      },
    });
    await this.indexInAiEngine(node.id, node.content, { title: node.title, type: node.type, tags: node.tags });
    return this.toResponse(node);
  }

  async uploadFile(userId: string, file: { filename: string; mimetype: string; content: Buffer }) {
    const content = file.content.toString('utf8');
    const sizeBytes = file.content.byteLength;
    const title = file.filename;
    const type = this.inferTypeFromMime(file.mimetype);
    const node = await this.prisma.memoryNode.create({
      data: {
        title,
        type,
        content,
        sizeBytes,
        tags: [],
        userId,
      },
    });
    await this.indexInAiEngine(node.id, content, { title, type });
    return this.toResponse(node);
  }

  private inferTypeFromMime(mimetype: string): string {
    if (mimetype.includes('text/') || mimetype.includes('json')) return 'document';
    if (mimetype.includes('image/')) return 'image';
    if (mimetype.includes('code') || mimetype.includes('javascript') || mimetype.includes('python')) return 'code';
    return 'data';
  }

  private async indexInAiEngine(documentId: string, content: string, metadata?: Record<string, unknown>) {
    try {
      const res = await fetch(`${this.aiEngineUrl}/memory/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId, content, metadata }),
      });
      if (!res.ok) await this.rabbitMQ.publishMemoryIndex({ documentId, content, metadata });
    } catch {
      await this.rabbitMQ.publishMemoryIndex({ documentId, content, metadata });
    }
  }

  async findAll(userId: string, query?: string, tags?: string[]) {
    const nodes = await this.prisma.memoryNode.findMany({
      where: {
        userId,
        ...(query && {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        }),
        ...(tags?.length && { tags: { hasSome: tags } }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return nodes.map(this.toResponse);
  }

  async findOne(id: string, userId: string) {
    const node = await this.prisma.memoryNode.findFirst({
      where: { id, userId },
    });
    if (!node) throw new NotFoundException('Memory node not found');
    return this.toResponse(node);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.memoryNode.delete({ where: { id } });
    try {
      await fetch(`${this.aiEngineUrl}/memory/document/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // best effort: vector store may still have chunks until next sync
    }
  }

  async search(userId: string, query: string, tags?: string[], limit = 10) {
    const userNodes = await this.prisma.memoryNode.findMany({
      where: {
        userId,
        ...(tags?.length && { tags: { hasSome: tags } }),
      },
      select: { id: true },
    });
    const documentIds = userNodes.map((n) => n.id);
    try {
      const res = await fetch(`${this.aiEngineUrl}/memory/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, document_ids: documentIds, limit }),
      });
      if (res.ok) {
        const data = (await res.json()) as { results?: Array<{ content: string; document_id?: string; score?: number }> };
        const results = data.results ?? [];
        const nodeIds = [...new Set(results.map((r) => r.document_id).filter(Boolean))] as string[];
        if (nodeIds.length > 0) {
          const nodes = await this.prisma.memoryNode.findMany({
            where: { id: { in: nodeIds }, userId },
          });
          const nodeMap = new Map(nodes.map((n) => [n.id, n]));
          return results.map((r) => {
          const node = nodeMap.get(r.document_id ?? '');
          const base = node ? this.toResponse(node) : { id: r.document_id, content: r.content, title: '', type: 'document', tags: [], date: '', size: '' };
          return { ...base, content: r.content, score: r.score };
        });
        }
      }
    } catch {
      // fallback to keyword search
    }
    const nodes = await this.prisma.memoryNode.findMany({
      where: { userId, ...(tags?.length && { tags: { hasSome: tags } }) },
      take: limit * 2,
    });
    const filtered = nodes.filter(
      (n) =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.content.toLowerCase().includes(query.toLowerCase()),
    );
    return filtered.slice(0, limit).map(this.toResponse);
  }

  async getGraph(userId: string) {
    const nodes = await this.prisma.memoryNode.findMany({
      where: { userId },
      take: 50,
    });
    const nodeList = nodes.map((n, i) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      x: (i % 5) * 200,
      y: Math.floor(i / 5) * 150,
    }));
    const edges = nodes.slice(0, -1).map((n, i) => ({
      source: n.id,
      target: nodes[i + 1]?.id ?? nodes[0].id,
    }));
    return { nodes: nodeList, edges };
  }

  async getStats(userId: string) {
    const [count, result] = await Promise.all([
      this.prisma.memoryNode.count({ where: { userId } }),
      this.prisma.memoryNode.aggregate({
        where: { userId },
        _sum: { sizeBytes: true },
      }),
    ]);
    const sizeBytes = result._sum.sizeBytes ?? 0;
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    return { nodeCount: count, sizeBytes, sizeMB: `${sizeMB} MB` };
  }

  private toResponse(node: {
    id: string;
    title: string;
    type: string;
    content: string;
    sizeBytes: number;
    tags: string[];
    createdAt: Date;
  }) {
    return {
      id: node.id,
      title: node.title,
      type: node.type,
      content: node.content.slice(0, 200) + (node.content.length > 200 ? '...' : ''),
      size: `${(node.sizeBytes / 1024).toFixed(1)} KB`,
      tags: node.tags,
      date: this.formatTimeAgo(node.createdAt),
    };
  }

  private formatTimeAgo(date: Date) {
    const sec = (Date.now() - date.getTime()) / 1000;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  }
}
