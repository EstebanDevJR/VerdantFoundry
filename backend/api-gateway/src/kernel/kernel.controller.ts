import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { KernelService } from './kernel.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('kernel')
export class KernelController {
  constructor(private kernelService: KernelService) {}

  @Get('metrics')
  getMetrics(@CurrentUser('id') userId: string) {
    return this.kernelService.getMetrics(userId);
  }

  @Get('state')
  getState() {
    return this.kernelService.getState();
  }

  @Post('state')
  setState(@Body('state') state: 'running' | 'paused' | 'stopped') {
    return this.kernelService.setState(state);
  }

  @Get('processes')
  getProcesses(@CurrentUser('id') userId: string) {
    return this.kernelService.getProcesses(userId);
  }

  @Post('processes/:id/action')
  processAction(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('action') action: string,
  ) {
    return this.kernelService.processAction(id, userId, action);
  }

  @Get('logs')
  getLogs(@Query('limit') limit?: string) {
    return this.kernelService.getLogs(limit ? parseInt(limit, 10) : 50);
  }

  @Get('network')
  getNetwork(@CurrentUser('id') userId: string) {
    return this.kernelService.getNetwork(userId);
  }

  @Get('filesystem')
  getFilesystem() {
    return this.kernelService.getFilesystem();
  }
}
