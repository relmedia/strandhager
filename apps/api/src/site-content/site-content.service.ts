import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SiteContentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Record<string, unknown>> {
    const rows = await this.prisma.siteSection.findMany();
    return Object.fromEntries(rows.map((row) => [row.key, row.data]));
  }

  async findOne(key: string): Promise<unknown> {
    const row = await this.prisma.siteSection.findUnique({ where: { key } });
    if (!row) {
      throw new NotFoundException(`Unknown section "${key}"`);
    }
    return row.data;
  }

  async upsert(key: string, data: object): Promise<unknown> {
    const row = await this.prisma.siteSection.upsert({
      where: { key },
      create: { key, data },
      update: { data },
    });
    return row.data;
  }
}
