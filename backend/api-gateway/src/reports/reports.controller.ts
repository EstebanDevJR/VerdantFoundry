import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReportDto) {
    return this.reportsService.create(userId, dto);
  }

  @Post('from-research/:researchId')
  createFromResearch(
    @CurrentUser('id') userId: string,
    @Param('researchId') researchId: string,
  ) {
    return this.reportsService.createFromResearch(userId, researchId);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.reportsService.findAll(userId);
  }

  @Get('themes')
  getThemes() {
    return [
      { id: 'default', name: 'Default', colors: ['#0f172a', '#10b981'] },
      { id: 'ocean', name: 'Ocean', colors: ['#0c4a6e', '#06b6d4'] },
      { id: 'forest', name: 'Forest', colors: ['#14532d', '#22c55e'] },
      { id: 'sunset', name: 'Sunset', colors: ['#7c2d12', '#f97316'] },
      { id: 'midnight', name: 'Midnight', colors: ['#1e1b4b', '#818cf8'] },
    ];
  }

  @Get('layouts')
  getLayouts() {
    return [
      { id: 'default', name: 'Default', columns: 1 },
      { id: 'two-column', name: 'Two Column', columns: 2 },
      { id: 'sidebar', name: 'Sidebar', columns: 2 },
      { id: 'magazine', name: 'Magazine', columns: 3 },
    ];
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.reportsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.reportsService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.reportsService.remove(id, userId);
  }

  @Patch(':id/blocks/:blockIndex')
  updateBlock(
    @Param('id') id: string,
    @Param('blockIndex') blockIndex: string,
    @CurrentUser('id') userId: string,
    @Body() body: { type: string; content: string; meta?: Record<string, unknown> },
  ) {
    return this.reportsService.updateBlock(id, userId, parseInt(blockIndex, 10), body);
  }

  @Post(':id/blocks')
  addBlock(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { type: string; content: string; meta?: Record<string, unknown>; afterIndex?: number },
  ) {
    const { afterIndex, ...block } = body;
    return this.reportsService.addBlock(id, userId, block, afterIndex);
  }

  @Delete(':id/blocks/:blockIndex')
  removeBlock(
    @Param('id') id: string,
    @Param('blockIndex') blockIndex: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportsService.removeBlock(id, userId, parseInt(blockIndex, 10));
  }

  @Patch(':id/blocks/reorder')
  reorderBlocks(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { fromIndex: number; toIndex: number },
  ) {
    return this.reportsService.reorderBlocks(id, userId, body.fromIndex, body.toIndex);
  }

  @Post(':id/export')
  async exportReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('format') format: string,
    @Res() res: FastifyReply,
  ) {
    const fmt = (format || 'pdf').toLowerCase();
    if (fmt === 'markdown' || fmt === 'md') {
      const md = await this.reportsService.exportMarkdown(id, userId);
      res.header('Content-Type', 'text/markdown; charset=utf-8');
      res.header('Content-Disposition', `attachment; filename="report-${id}.md"`);
      res.send(md);
    } else if (fmt === 'html') {
      const html = await this.reportsService.exportHtml(id, userId);
      res.header('Content-Type', 'text/html; charset=utf-8');
      res.header('Content-Disposition', `attachment; filename="report-${id}.html"`);
      res.send(html);
    } else if (fmt === 'docx') {
      const docx = await this.reportsService.exportDocx(id, userId);
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.header('Content-Disposition', `attachment; filename="report-${id}.docx"`);
      res.send(docx);
    } else {
      const pdf = await this.reportsService.exportPdf(id, userId);
      res.header('Content-Type', 'application/pdf');
      res.header('Content-Disposition', `attachment; filename="report-${id}.pdf"`);
      res.send(pdf);
    }
  }
}
