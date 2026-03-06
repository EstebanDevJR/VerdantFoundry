import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InternalController } from './internal.controller';
import { InternalGuard } from './internal.guard';

@Module({
  imports: [ConfigModule],
  controllers: [InternalController],
  providers: [InternalGuard],
})
export class InternalModule {}
