import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VersioningService {
  constructor(private prisma: PrismaService) {}

  async createVersion(
    userId: string,
    entityType: string,
    entityId: string,
    snapshot: unknown,
    changeSummary?: string,
    label?: string,
  ) {
    const lastVersion = await this.prisma.version.findFirst({
      where: { entityType, entityId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;
    return this.prisma.version.create({
      data: {
        entityType,
        entityId,
        version: nextVersion,
        label: label ?? `v${nextVersion}.0`,
        snapshot: snapshot as object,
        changeSummary,
        userId,
      },
    });
  }

  async getVersions(entityType: string, entityId: string) {
    return this.prisma.version.findMany({
      where: { entityType, entityId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        label: true,
        changeSummary: true,
        createdAt: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async getVersion(entityType: string, entityId: string, version: number) {
    const v = await this.prisma.version.findFirst({
      where: { entityType, entityId, version },
    });
    if (!v) throw new NotFoundException('Version not found');
    return v;
  }

  async getLatestVersion(entityType: string, entityId: string) {
    return this.prisma.version.findFirst({
      where: { entityType, entityId },
      orderBy: { version: 'desc' },
    });
  }

  async diffVersions(entityType: string, entityId: string, fromVersion: number, toVersion: number) {
    const [from, to] = await Promise.all([
      this.getVersion(entityType, entityId, fromVersion),
      this.getVersion(entityType, entityId, toVersion),
    ]);
    return {
      from: { version: from.version, label: from.label, createdAt: from.createdAt },
      to: { version: to.version, label: to.label, createdAt: to.createdAt },
      fromSnapshot: from.snapshot,
      toSnapshot: to.snapshot,
    };
  }

  async getUserVersionHistory(userId: string, limit = 50) {
    return this.prisma.version.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        version: true,
        label: true,
        changeSummary: true,
        createdAt: true,
      },
    });
  }
}
