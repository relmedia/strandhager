import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    void this.prisma;
    return [];
  }

  findBySlug(slug: string) {
    return { slug, message: 'Not implemented' };
  }

  create(dto: CreatePageDto) {
    return { ...dto, message: 'Not implemented' };
  }
}
