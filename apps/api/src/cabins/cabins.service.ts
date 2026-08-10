import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCabinDto } from './dto/create-cabin.dto';
import { UpdateCabinDto } from './dto/update-cabin.dto';

@Injectable()
export class CabinsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    void this.prisma;
    return [];
  }

  findOne(id: string) {
    return { id, message: 'Not implemented' };
  }

  create(dto: CreateCabinDto) {
    return { ...dto, message: 'Not implemented' };
  }

  update(id: string, dto: UpdateCabinDto) {
    return { id, ...dto, message: 'Not implemented' };
  }

  remove(id: string) {
    return { id, message: 'Not implemented' };
  }
}
