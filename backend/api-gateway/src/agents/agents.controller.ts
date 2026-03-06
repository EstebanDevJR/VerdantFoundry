import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Controller('agents')
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAgentDto) {
    return this.agentsService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.agentsService.findAll(userId);
  }

  @Get(':id/logs')
  getLogs(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.agentsService.getLogs(id, userId, limit ? parseInt(limit, 10) : 20);
  }

  @Get(':id/memory')
  getMemory(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.agentsService.getMemory(id, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.agentsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agentsService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.agentsService.remove(id, userId);
  }

  @Post(':id/action')
  action(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('action') action: string,
  ) {
    return this.agentsService.action(id, userId, action);
  }
}
