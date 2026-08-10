import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    void this.prisma;
    return [];
  }

  findOne(id: string) {
    return { id, message: 'Not implemented' };
  }

  create(dto: CreateGuestDto) {
    return { ...dto, message: 'Not implemented' };
  }
}
