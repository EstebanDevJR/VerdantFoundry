import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const KEY_PREFIX_LIVE = 'vf_live_';
const KEY_PREFIX_TEST = 'vf_test_';
const KEY_BYTES = 32;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateMe(id: string, data: { firstName?: string; lastName?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
  }

  async getMe(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    });
  }

  async getApiKeys(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, prefix: true, lastUsed: true, createdAt: true },
    });
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      key: k.prefix + '••••••••••••••••••••',
      prefix: k.prefix,
      lastUsed: k.lastUsed?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  }

  async createApiKey(userId: string, name: string, prefix: 'vf_live' | 'vf_test' = 'vf_test') {
    const raw = crypto.randomBytes(KEY_BYTES).toString('base64url').slice(0, KEY_BYTES);
    const keyPrefix = prefix === 'vf_live' ? KEY_PREFIX_LIVE : KEY_PREFIX_TEST;
    const fullKey = keyPrefix + raw;
    const keyHash = await bcrypt.hash(fullKey, 10);
    const apiKey = await this.prisma.apiKey.create({
      data: {
        name,
        key: keyHash,
        prefix: keyPrefix,
        userId,
      },
    });
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: fullKey,
      prefix: apiKey.prefix,
      createdAt: apiKey.createdAt.toISOString(),
      message: 'Store this key securely. It will not be shown again.',
    };
  }

  async revokeApiKey(userId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.delete({ where: { id } });
    return { ok: true };
  }

  async validateApiKey(keyHeader: string): Promise<string | null> {
    const prefix = keyHeader.startsWith(KEY_PREFIX_LIVE) ? KEY_PREFIX_LIVE : KEY_PREFIX_TEST;
    const keys = await this.prisma.apiKey.findMany({
      where: { prefix },
    });
    for (const k of keys) {
      const match = await bcrypt.compare(keyHeader, k.key);
      if (match) {
        await this.prisma.apiKey.update({
          where: { id: k.id },
          data: { lastUsed: new Date() },
        });
        return k.userId;
      }
    }
    return null;
  }
}
