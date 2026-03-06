import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
    ];
  }

  @Get('layouts')
  getLayouts() {
    return [
      { id: 'default', name: 'Default', columns: 1 },
      { id: 'two-column', name: 'Two Column', columns: 2 },
      { id: 'sidebar', name: 'Sidebar', columns: 2 },
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

  @Post(':id/export')
  async exportPdf(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res() res: FastifyReply,
  ) {
    const pdf = await this.reportsService.exportPdf(id, userId);
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', `attachment; filename="report-${id}.pdf"`);
    res.send(pdf);
  }
}
