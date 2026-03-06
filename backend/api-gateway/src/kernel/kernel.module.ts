import { Module } from '@nestjs/common';
import { KernelService } from './kernel.service';
import { KernelController } from './kernel.controller';

@Module({
  controllers: [KernelController],
  providers: [KernelService],
  exports: [KernelService],
})
export class KernelModule {}
