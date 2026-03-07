import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { AgentsModule } from './agents/agents.module';
import { ToolsModule } from './tools/tools.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { KernelModule } from './kernel/kernel.module';
import { MemoryModule } from './memory/memory.module';
import { ResearchModule } from './research/research.module';
import { EvolutionModule } from './evolution/evolution.module';
import { InternalModule } from './internal/internal.module';
import { WebsocketModule } from './websocket/websocket.module';
import { UsersModule } from './users/users.module';
import { JwtOrApiKeyAuthGuard } from './auth/guards/jwt-or-apikey.guard';
import { VersioningModule } from './versioning/versioning.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RabbitMQModule,
    RedisModule,
    UsersModule,
    AuthModule,
    AgentsModule,
    ToolsModule,
    ReportsModule,
    DashboardModule,
    KernelModule,
    MemoryModule,
    ResearchModule,
    EvolutionModule,
    InternalModule,
    WebsocketModule,
    VersioningModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtOrApiKeyAuthGuard }],
})
export class AppModule {}
