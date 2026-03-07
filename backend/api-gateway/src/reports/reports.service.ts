import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

interface ReportBlock {
  type: string;
  content: string;
  meta?: Record<string, unknown>;
}

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

    const blocks = this.parseMarkdownToBlocks(research.reportContent);
    return this.prisma.report.create({
      data: {
        title: research.query.slice(0, 100) || 'Research Report',
        blocks: blocks as unknown as Prisma.InputJsonValue,
        userId,
      },
    });
  }

  private parseMarkdownToBlocks(markdown: string): ReportBlock[] {
    const blocks: ReportBlock[] = [];
    const sections = markdown.split(/(?=^#{1,3}\s)/m);

    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed) continue;

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const title = headingMatch[2];
        const body = trimmed.slice(headingMatch[0].length).trim();
        blocks.push({
          type: 'heading',
          content: title,
          meta: { level },
        });
        if (body) {
          blocks.push({ type: 'markdown', content: body });
        }
      } else {
        blocks.push({ type: 'markdown', content: trimmed });
      }
    }

    if (blocks.length === 0) {
      blocks.push({ type: 'markdown', content: markdown });
    }
    return blocks;
  }

  async create(userId: string, dto: CreateReportDto) {
    return this.prisma.report.create({
      data: {
        title: dto.title,
        blocks: (dto.blocks ?? []) as Prisma.InputJsonValue,
        themeId: dto.themeId,
        layoutId: dto.layoutId,
        userId,
      },
    });
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

  async updateBlock(id: string, userId: string, blockIndex: number, block: ReportBlock) {
    const report = await this.findOne(id, userId);
    const blocks = (report.blocks as unknown as ReportBlock[]) ?? [];
    if (blockIndex < 0 || blockIndex >= blocks.length) {
      throw new NotFoundException('Block index out of range');
    }
    blocks[blockIndex] = block;
    return this.prisma.report.update({
      where: { id },
      data: { blocks: blocks as unknown as Prisma.InputJsonValue },
    });
  }

  async addBlock(id: string, userId: string, block: ReportBlock, afterIndex?: number) {
    const report = await this.findOne(id, userId);
    const blocks = (report.blocks as unknown as ReportBlock[]) ?? [];
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : blocks.length;
    blocks.splice(insertAt, 0, block);
    return this.prisma.report.update({
      where: { id },
      data: { blocks: blocks as unknown as Prisma.InputJsonValue },
    });
  }

  async removeBlock(id: string, userId: string, blockIndex: number) {
    const report = await this.findOne(id, userId);
    const blocks = (report.blocks as unknown as ReportBlock[]) ?? [];
    if (blockIndex < 0 || blockIndex >= blocks.length) {
      throw new NotFoundException('Block index out of range');
    }
    blocks.splice(blockIndex, 1);
    return this.prisma.report.update({
      where: { id },
      data: { blocks: blocks as unknown as Prisma.InputJsonValue },
    });
  }

  async reorderBlocks(id: string, userId: string, fromIndex: number, toIndex: number) {
    const report = await this.findOne(id, userId);
    const blocks = (report.blocks as unknown as ReportBlock[]) ?? [];
    if (fromIndex < 0 || fromIndex >= blocks.length || toIndex < 0 || toIndex >= blocks.length) {
      throw new NotFoundException('Block index out of range');
    }
    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, moved);
    return this.prisma.report.update({
      where: { id },
      data: { blocks: blocks as unknown as Prisma.InputJsonValue },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.report.delete({ where: { id } });
  }

  async exportMarkdown(id: string, userId: string): Promise<string> {
    const report = await this.findOne(id, userId);
    const blocks = (report.blocks as unknown as ReportBlock[]) ?? [];
    const lines: string[] = [`# ${report.title}`, ''];

    for (const block of blocks) {
      if (block.type === 'heading') {
        const level = (block.meta?.level as number) || 2;
        lines.push(`${'#'.repeat(level)} ${block.content}`, '');
      } else if (block.type === 'code') {
        const lang = (block.meta?.language as string) || '';
        lines.push(`\`\`\`${lang}`, block.content, '```', '');
      } else if (block.type === 'image') {
        const alt = (block.meta?.alt as string) || 'Image';
        lines.push(`![${alt}](${block.content})`, '');
      } else if (block.type === 'table') {
        lines.push(block.content, '');
      } else {
        lines.push(block.content, '');
      }
    }
    return lines.join('\n');
  }

  async exportHtml(id: string, userId: string): Promise<string> {
    const report = await this.findOne(id, userId);
    const blocks = (report.blocks as unknown as ReportBlock[]) ?? [];
    const bodyParts: string[] = [];

    for (const block of blocks) {
      if (block.type === 'heading') {
        const level = (block.meta?.level as number) || 2;
        bodyParts.push(`<h${level}>${escapeHtml(block.content)}</h${level}>`);
      } else if (block.type === 'code') {
        bodyParts.push(`<pre><code>${escapeHtml(block.content)}</code></pre>`);
      } else if (block.type === 'image') {
        const alt = (block.meta?.alt as string) || '';
        bodyParts.push(`<figure><img src="${escapeHtml(block.content)}" alt="${escapeHtml(alt)}" />${alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : ''}</figure>`);
      } else if (block.type === 'markdown') {
        bodyParts.push(`<div class="block">${markdownToHtml(block.content)}</div>`);
      } else {
        bodyParts.push(`<div class="block block-${block.type}">${escapeHtml(block.content)}</div>`);
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(report.title)}</title>
  <style>
    :root { --primary: #10b981; --bg: #fff; --text: #1e293b; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: var(--text); line-height: 1.7; padding: 3rem 2rem; max-width: 860px; margin: 0 auto; background: var(--bg); }
    h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
    h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    h3 { font-size: 1.2rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; }
    p { margin-bottom: 1rem; }
    ul, ol { margin-left: 1.5rem; margin-bottom: 1rem; }
    li { margin-bottom: 0.25rem; }
    pre { background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1rem; font-size: 0.875rem; }
    code { font-family: 'JetBrains Mono', monospace; background: #f1f5f9; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.875em; }
    pre code { background: none; padding: 0; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    blockquote { border-left: 4px solid var(--primary); padding-left: 1rem; color: #64748b; margin-bottom: 1rem; }
    figure { margin-bottom: 1rem; text-align: center; }
    figure img { max-width: 100%; height: auto; border-radius: 0.5rem; }
    figcaption { font-size: 0.875rem; color: #64748b; margin-top: 0.5rem; }
    .block { margin-bottom: 1.5rem; }
    .meta { color: #94a3b8; font-size: 0.875rem; margin-bottom: 2rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  <div class="meta">Generated by Verdant Foundry &middot; ${new Date().toLocaleDateString()}</div>
  ${bodyParts.join('\n  ')}
</body>
</html>`;
  }

  async exportPdf(id: string, userId: string): Promise<Buffer> {
    const html = await this.exportHtml(id, userId);
    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' } });
      await browser.close();
      return Buffer.from(pdf);
    } catch (e) {
      throw new Error(`PDF export failed: ${(e as Error).message}`);
    }
  }

  async exportDocx(id: string, userId: string): Promise<Buffer> {
    const markdown = await this.exportMarkdown(id, userId);
    const lines = markdown.split('\n');
    const xmlParts: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('### ')) {
        xmlParts.push(wrapDocxParagraph(trimmed.slice(4), 'Heading3'));
      } else if (trimmed.startsWith('## ')) {
        xmlParts.push(wrapDocxParagraph(trimmed.slice(3), 'Heading2'));
      } else if (trimmed.startsWith('# ')) {
        xmlParts.push(wrapDocxParagraph(trimmed.slice(2), 'Heading1'));
      } else if (trimmed.startsWith('```')) {
        continue;
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        xmlParts.push(wrapDocxParagraph(trimmed.slice(2), 'ListBullet'));
      } else {
        xmlParts.push(wrapDocxParagraph(trimmed, 'Normal'));
      }
    }

    const documentXml = buildMinimalDocx(xmlParts.join('\n'));
    return Buffer.from(documentXml, 'utf-8');
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
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^> (.*$)/gim, '<blockquote><p>$1</p></blockquote>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrapDocxParagraph(text: string, style: string): string {
  const cleaned = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(cleaned)}</w:t></w:r></w:p>`;
}

function buildMinimalDocx(bodyContent: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:sl="http://schemas.microsoft.com/schemaLibrary/2003/core"
  xmlns:aml="http://schemas.microsoft.com/aml/2001/core"
  xmlns:wx="http://schemas.microsoft.com/office/word/2003/auxHint"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:dt="uuid:C2F41010-65B3-11d1-A29F-00AA00C14882"
  w:macrosPresent="no" w:embeddedObjPresent="no" w:ocxPresent="no" xml:space="preserve">
<w:body>
${bodyContent}
</w:body>
</w:wordDocument>`;
}
