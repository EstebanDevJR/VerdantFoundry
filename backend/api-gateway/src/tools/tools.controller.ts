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
import { ToolsService } from './tools.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';

@Controller('tools')
export class ToolsController {
  constructor(private toolsService: ToolsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateToolDto) {
    return this.toolsService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.toolsService.findAll(userId);
  }

  @Get(':id/logs')
  getLogs(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.toolsService.getLogs(id, userId, limit ? parseInt(limit, 10) : 20);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.toolsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateToolDto,
  ) {
    return this.toolsService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.toolsService.remove(id, userId);
  }

  @Post(':id/execute')
  execute(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { params?: Record<string, unknown> },
  ) {
    return this.toolsService.execute(id, userId, body.params ?? {});
  }

}
