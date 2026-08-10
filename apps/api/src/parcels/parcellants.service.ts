import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@cabin/database';

import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateParcellantDto,
  UpdateParcellantDto,
} from './dto/parcellant.dto';

const INCLUDE = {
  parcels: { select: { id: true, number: true }, orderBy: { number: 'asc' } },
  ownerships: {
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      parcel: { select: { id: true, number: true } },
    },
    // Running first, then most recently given up.
    orderBy: [{ endedAt: { sort: 'desc', nulls: 'first' } }, { startedAt: 'desc' }],
  },
} satisfies Prisma.ParcellantInclude;

type ParcellantRecord = Prisma.ParcellantGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class ParcellantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: string) {
    const search = query?.trim();

    const parcellants = await this.prisma.parcellant.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: INCLUDE,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return parcellants.map(toView);
  }

  async findOne(id: string) {
    const parcellant = await this.prisma.parcellant.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!parcellant) {
      throw new NotFoundException('Fant ingen parsellant med denne id-en');
    }

    return toView(parcellant);
  }

  async create(dto: CreateParcellantDto) {
    await this.assertEmailFree(dto.email);

    const parcellant = await this.prisma.parcellant.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone || null,
        address: dto.address || null,
        notes: dto.notes || null,
      },
      include: INCLUDE,
    });

    return toView(parcellant);
  }

  async update(id: string, dto: UpdateParcellantDto) {
    const existing = await this.prisma.parcellant.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Fant ingen parsellant med denne id-en');
    }

    if (dto.email && dto.email !== existing.email) {
      await this.assertEmailFree(dto.email);
    }

    const parcellant = await this.prisma.parcellant.update({
      where: { id },
      data: patch(dto),
      include: INCLUDE,
    });

    return toView(parcellant);
  }

  /** The plots they owned are freed up, not deleted along with them. */
  async remove(id: string) {
    await this.findOne(id);

    // Deleting them would take the plot's history with them, which is the one
    // thing the history is there to prevent.
    const spells = await this.prisma.ownership.findMany({
      where: { parcellantId: id },
      select: { parcel: { select: { number: true } } },
      orderBy: { parcel: { number: 'asc' } },
    });

    if (spells.length > 0) {
      const plots = [...new Set(spells.map((spell) => spell.parcel.number))];
      const list = plots.join(', ');

      throw new ConflictException(
        `Kan ikke slette: står i historikken til parsell ${list}. Fjern periodene der først hvis oppføringen er feil.`,
      );
    }

    await this.prisma.parcellant.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async assertEmailFree(email: string) {
    const taken = await this.prisma.parcellant.findFirst({
      where: { email },
      select: { id: true },
    });

    if (taken) {
      throw new ConflictException('Det finnes allerede en parsellant med denne e-posten');
    }
  }
}

/** Only the fields that were sent, with empty text read as "nothing". */
function patch(dto: UpdateParcellantDto) {
  return {
    ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
    ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
    ...(dto.email !== undefined ? { email: dto.email } : {}),
    ...(dto.phone !== undefined ? { phone: dto.phone || null } : {}),
    ...(dto.address !== undefined ? { address: dto.address || null } : {}),
    ...(dto.notes !== undefined ? { notes: dto.notes || null } : {}),
  };
}

export function toView(parcellant: ParcellantRecord) {
  return {
    id: parcellant.id,
    firstName: parcellant.firstName,
    lastName: parcellant.lastName,
    email: parcellant.email,
    phone: parcellant.phone,
    address: parcellant.address,
    notes: parcellant.notes,
    parcels: parcellant.parcels,
    /** Every plot they have owned, so the list can show what they had before. */
    history: parcellant.ownerships.map((spell) => ({
      id: spell.id,
      parcel: spell.parcel,
      startedAt: spell.startedAt.toISOString().slice(0, 10),
      endedAt: spell.endedAt ? spell.endedAt.toISOString().slice(0, 10) : null,
    })),
    createdAt: parcellant.createdAt.toISOString(),
  };
}
