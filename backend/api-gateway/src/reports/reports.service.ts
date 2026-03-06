import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createFromResearch(userId: string, researchId: string) {
    const research = await this.prisma.research.findFirst({
      where: { id: researchId, userId },
    });
    if (!research) throw new NotFoundException('Research not found');
    if (!research.reportContent) {
      throw new NotFoundException('Research has no report content yet');
    }
    const blocks = [{ type: 'markdown', content: research.reportContent }];
    return this.prisma.report.create({
      data: {
        title: research.query.slice(0, 100) || 'Research Report',
        blocks: blocks as unknown as Prisma.InputJsonValue,
        userId,
      },
    });
  }

  async create(userId: string, dto: CreateReportDto) {
    const report = await this.prisma.report.create({
      data: {
        title: dto.title,
        blocks: (dto.blocks ?? []) as Prisma.InputJsonValue,
        themeId: dto.themeId,
        layoutId: dto.layoutId,
        userId,
      },
    });
    return report;
  }

  async findAll(userId: string) {
    return this.prisma.report.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const report = await this.prisma.report.findFirst({
      where: { id, userId },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async update(id: string, userId: string, dto: UpdateReportDto) {
    await this.findOne(id, userId);
    return this.prisma.report.update({
      where: { id },
      data: {
        title: dto.title,
        blocks: dto.blocks as Prisma.InputJsonValue | undefined,
        themeId: dto.themeId,
        layoutId: dto.layoutId,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.report.delete({ where: { id } });
  }

  async exportPdf(id: string, userId: string): Promise<Buffer> {
    const report = await this.findOne(id, userId);
    const blocks = (report.blocks as Array<{ type: string; content: string }>) ?? [];
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
  pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.2rem; margin-top: 1.5rem; }
</style></head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  ${blocks
    .map(
      (b) =>
        `<div class="block block-${b.type}">${b.type === 'markdown' ? markdownToHtml(b.content) : escapeHtml(b.content)}</div>`,
    )
    .join('')}
</body>
</html>`;
    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      return Buffer.from(pdf);
    } catch (e) {
      throw new Error(`PDF export failed: ${(e as Error).message}`);
    }
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markdownToHtml(md: string): string {
  const escaped = escapeHtml(md);
  return escaped
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}
