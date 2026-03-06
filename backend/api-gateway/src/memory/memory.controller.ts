import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { MemoryService } from './memory.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateMemoryDto } from './dto/create-memory.dto';

@Controller('memory')
export class MemoryController {
  constructor(private memoryService: MemoryService) {}

  @Post('upload')
  async upload(@CurrentUser('id') userId: string, @Req() req: FastifyRequest) {
    const data = await req.file();
    if (!data) throw new BadRequestException('No file uploaded');
    const buffer = await data.toBuffer();
    return this.memoryService.uploadFile(userId, {
      filename: data.filename,
      mimetype: data.mimetype,
      content: buffer,
    });
  }

  @Post('documents')
  create(@CurrentUser('id') userId: string, @Body() dto: CreateMemoryDto) {
    return this.memoryService.createDocument(userId, dto);
  }

  @Get('stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.memoryService.getStats(userId);
  }

  @Get('graph')
  getGraph(@CurrentUser('id') userId: string) {
    return this.memoryService.getGraph(userId);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('query') query?: string,
    @Query('tags') tags?: string | string[],
  ) {
    const tagArray = Array.isArray(tags) ? tags : tags ? [tags] : undefined;
    return this.memoryService.findAll(userId, query, tagArray);
  }

  @Post('search')
  search(
    @CurrentUser('id') userId: string,
    @Body() body: { query: string; tags?: string[]; limit?: number },
  ) {
    return this.memoryService.search(userId, body.query, body.tags, body.limit ?? 10);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.memoryService.findOne(id, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.memoryService.remove(id, userId);
  }
}
