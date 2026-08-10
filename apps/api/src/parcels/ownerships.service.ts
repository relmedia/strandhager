import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@cabin/database';

import { PrismaService } from '../prisma/prisma.service';
import type { CreateOwnershipDto, UpdateOwnershipDto } from './dto/ownership.dto';

const INCLUDE = {
  parcellant: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  },
} satisfies Prisma.OwnershipInclude;

type OwnershipRecord = Prisma.OwnershipGetPayload<{ include: typeof INCLUDE }>;

/** Anything Prisma can run a query on, so this works inside a transaction too. */
type Db = Prisma.TransactionClient | PrismaService;

/** A plain day, with no time of day to drift across time zones. */
export function toDay(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function today() {
  return toDay(new Date().toISOString().slice(0, 10));
}

@Injectable()
export class OwnershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async findForParcel(parcelId: string) {
    await this.assertParcel(parcelId);

    const spells = await this.prisma.ownership.findMany({
      where: { parcelId },
      include: INCLUDE,
      // The present owner first, then the most recent, which is how the
      // history reads.
      orderBy: [{ endedAt: { sort: 'desc', nulls: 'first' } }, { startedAt: 'desc' }],
    });

    return spells.map(toView);
  }

  async findForParcellant(parcellantId: string) {
    const spells = await this.prisma.ownership.findMany({
      where: { parcellantId },
      include: { ...INCLUDE, parcel: { select: { id: true, number: true } } },
      orderBy: [{ endedAt: { sort: 'desc', nulls: 'first' } }, { startedAt: 'desc' }],
    });

    return spells.map((spell) => ({ ...toView(spell), parcel: spell.parcel }));
  }

  async create(parcelId: string, dto: CreateOwnershipDto) {
    await this.assertParcel(parcelId);
    await this.assertParcellant(dto.parcellantId);

    const startedAt = toDay(dto.startedAt);
    const endedAt = dto.endedAt ? toDay(dto.endedAt) : null;

    assertOrder(startedAt, endedAt);

    return this.prisma.$transaction(async (tx) => {
      await this.assertFree(tx, parcelId, startedAt, endedAt);

      const spell = await tx.ownership.create({
        data: {
          parcelId,
          parcellantId: dto.parcellantId,
          startedAt,
          endedAt,
          notes: dto.notes || null,
        },
        include: INCLUDE,
      });

      await syncOwner(tx, parcelId);
      return toView(spell);
    });
  }

  async update(id: string, dto: UpdateOwnershipDto) {
    const existing = await this.prisma.ownership.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Fant ingen eierperiode med denne id-en');
    }

    if (dto.parcellantId) await this.assertParcellant(dto.parcellantId);

    const startedAt = dto.startedAt ? toDay(dto.startedAt) : existing.startedAt;
    const endedAt =
      dto.endedAt === undefined
        ? existing.endedAt
        : dto.endedAt === null
          ? null
          : toDay(dto.endedAt);

    assertOrder(startedAt, endedAt);

    return this.prisma.$transaction(async (tx) => {
      await this.assertFree(tx, existing.parcelId, startedAt, endedAt, id);

      const data: Prisma.OwnershipUpdateInput = { startedAt, endedAt };

      if (dto.parcellantId) {
        data.parcellant = { connect: { id: dto.parcellantId } };
      }
      if (dto.notes !== undefined) data.notes = dto.notes || null;

      const spell = await tx.ownership.update({ where: { id }, data, include: INCLUDE });

      await syncOwner(tx, existing.parcelId);
      return toView(spell);
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.ownership.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Fant ingen eierperiode med denne id-en');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.ownership.delete({ where: { id } });
      await syncOwner(tx, existing.parcelId);
    });

    return { id, deleted: true };
  }

  /** No two people can own the same plot at once. */
  private async assertFree(
    tx: Db,
    parcelId: string,
    startedAt: Date,
    endedAt: Date | null,
    ignoreId?: string,
  ) {
    const clash = await tx.ownership.findFirst({
      where: {
        parcelId,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
        // An open spell runs on for ever, so it clashes with anything after it.
        ...(endedAt ? { startedAt: { lte: endedAt } } : {}),
        OR: [{ endedAt: null }, { endedAt: { gte: startedAt } }],
      },
      include: INCLUDE,
    });

    if (clash) {
      const name = `${clash.parcellant.firstName} ${clash.parcellant.lastName}`;
      const from = day(clash.startedAt);
      const to = clash.endedAt ? day(clash.endedAt) : 'nå';

      throw new BadRequestException(
        `Perioden overlapper med ${name}, som eide parsellen fra ${from} til ${to}`,
      );
    }
  }

  private async assertParcel(parcelId: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      select: { id: true },
    });

    if (!parcel) {
      throw new NotFoundException('Fant ingen parsell med denne id-en');
    }
  }

  private async assertParcellant(parcellantId: string) {
    const person = await this.prisma.parcellant.findUnique({
      where: { id: parcellantId },
      select: { id: true },
    });

    if (!person) {
      throw new BadRequestException('Fant ingen parsellant med denne id-en');
    }
  }
}

/**
 * The plot's current owner is whoever holds the spell that has not ended, so it
 * is worked out again after any change to the history rather than being kept up
 * to date by hand in several places.
 */
export async function syncOwner(tx: Db, parcelId: string) {
  const open = await tx.ownership.findFirst({
    where: { parcelId, endedAt: null },
    orderBy: { startedAt: 'desc' },
    select: { parcellantId: true },
  });

  await tx.parcel.update({
    where: { id: parcelId },
    data: { ownerId: open?.parcellantId ?? null },
  });
}

function assertOrder(startedAt: Date, endedAt: Date | null) {
  if (endedAt && endedAt < startedAt) {
    throw new BadRequestException('Sluttdatoen kan ikke være før startdatoen');
  }
}

function day(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function toView(spell: OwnershipRecord) {
  return {
    id: spell.id,
    parcelId: spell.parcelId,
    parcellant: spell.parcellant,
    startedAt: day(spell.startedAt),
    endedAt: spell.endedAt ? day(spell.endedAt) : null,
    notes: spell.notes,
  };
}
