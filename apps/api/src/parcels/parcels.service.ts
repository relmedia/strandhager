import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@cabin/database';

import { PrismaService } from '../prisma/prisma.service';
import type { CreateParcelDto, UpdateParcelDto } from './dto/parcel.dto';
import { syncOwner, today } from './ownerships.service';

const INCLUDE = {
  owner: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  },
} satisfies Prisma.ParcelInclude;

type ParcelRecord = Prisma.ParcelGetPayload<{ include: typeof INCLUDE }>;

/**
 * Derived rather than stored, so a plot can never claim to be free while
 * somebody owns it.
 */
export type ParcelStatus = 'OWNED' | 'VACANT' | 'UNAVAILABLE';

@Injectable()
export class ParcelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const parcels = await this.prisma.parcel.findMany({
      include: INCLUDE,
      orderBy: { number: 'asc' },
    });

    return parcels.map(toView);
  }

  async findOne(id: string) {
    const parcel = await this.prisma.parcel.findUnique({ where: { id }, include: INCLUDE });

    if (!parcel) {
      throw new NotFoundException('Fant ingen parsell med denne id-en');
    }

    return toView(parcel);
  }

  async create(dto: CreateParcelDto) {
    await this.assertNumberFree(dto.number);

    const parcel = await this.prisma.parcel.create({
      data: {
        number: dto.number,
        size: dto.size ?? null,
        notes: dto.notes || null,
      },
      include: INCLUDE,
    });

    return toView(parcel);
  }

  async update(id: string, dto: UpdateParcelDto) {
    const existing = await this.prisma.parcel.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Fant ingen parsell med denne id-en');
    }

    if (dto.number !== undefined && dto.number !== existing.number) {
      await this.assertNumberFree(dto.number);
    }

    if (dto.ownerId) {
      const owner = await this.prisma.parcellant.findUnique({
        where: { id: dto.ownerId },
        select: { id: true },
      });

      if (!owner) {
        throw new BadRequestException('Fant ingen parsellant med denne id-en');
      }
    }

    const data: Prisma.ParcelUpdateInput = {};

    if (dto.number !== undefined) data.number = dto.number;
    if (dto.size !== undefined) data.size = dto.size;
    if (dto.notes !== undefined) data.notes = dto.notes || null;
    if (dto.available !== undefined) data.available = dto.available;

    const handover = dto.ownerId !== undefined && dto.ownerId !== existing.ownerId;

    const parcel = await this.prisma.$transaction(async (tx) => {
      // Selling a plot on closes the running spell and opens a new one, so the
      // plot keeps a record of everyone who has owned it.
      if (handover) {
        const day = today();

        await tx.ownership.updateMany({
          where: { parcelId: id, endedAt: null },
          data: { endedAt: day },
        });

        if (dto.ownerId) {
          await tx.ownership.create({
            data: { parcelId: id, parcellantId: dto.ownerId, startedAt: day },
          });
        }
      }

      await tx.parcel.update({ where: { id }, data });

      // The pointer to the current owner is worked out from the spells, so it
      // cannot disagree with the history.
      if (handover) await syncOwner(tx, id);

      return tx.parcel.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    });

    return toView(parcel);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.parcel.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async assertNumberFree(number: number) {
    const taken = await this.prisma.parcel.findUnique({
      where: { number },
      select: { id: true },
    });

    if (taken) {
      throw new ConflictException(`Parsell ${number} finnes allerede`);
    }
  }
}

export function toView(parcel: ParcelRecord) {
  return {
    id: parcel.id,
    number: parcel.number,
    size: parcel.size,
    notes: parcel.notes,
    available: parcel.available,
    status: statusOf(parcel),
    owner: parcel.owner,
    updatedAt: parcel.updatedAt.toISOString(),
  };
}

function statusOf(parcel: { ownerId: string | null; available: boolean }): ParcelStatus {
  if (parcel.ownerId) return 'OWNED';
  return parcel.available ? 'VACANT' : 'UNAVAILABLE';
}
