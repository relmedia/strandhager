import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { unpricedWeekdays } from '../pricing/quote';
import type { UpdateSpaceDto } from './dto/update-space.dto';

/** A space plus the price list the booking flow needs to quote it. */
export type SpaceWithRates = Awaited<ReturnType<SpacesService['findBySlug']>>;

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.space.findMany({
      orderBy: { name: 'asc' },
      include: { rates: { orderBy: { position: 'asc' } } },
    });
  }

  async findBySlug(slug: string) {
    const space = await this.prisma.space.findUnique({
      where: { slug },
      include: { rates: { orderBy: { position: 'asc' } } },
    });

    if (!space) {
      throw new NotFoundException(`Fant ingen lokale med adressen "${slug}"`);
    }

    return space;
  }

  /** Shape sent to the public site: the price cards and the booking rules. */
  async publicView(slug: string) {
    const space = await this.findBySlug(slug);

    return {
      slug: space.slug,
      name: space.name,
      description: space.description,
      maxGuests: space.maxGuests,
      cleaningFee: space.cleaningFee,
      priceNote: space.priceNote,
      noticeDays: space.noticeDays,
      active: space.active,
      rates: space.rates.map((rate) => ({
        id: rate.id,
        label: rate.label,
        weekdays: rate.weekdays,
        amount: rate.amount,
      })),
      /** Weekdays with no rate, which the calendar shows as unavailable. */
      closedWeekdays: unpricedWeekdays(space.rates),
    };
  }

  async update(slug: string, dto: UpdateSpaceDto) {
    const space = await this.findBySlug(slug);
    const { rates, ...fields } = dto;

    await this.prisma.$transaction(async (tx) => {
      await tx.space.update({ where: { id: space.id }, data: fields });

      // Rates have no stable identity in the editor, so the list is replaced
      // wholesale. Existing bookings keep their own price snapshot.
      if (rates) {
        await tx.rate.deleteMany({ where: { spaceId: space.id } });
        await tx.rate.createMany({
          data: rates.map((rate, position) => ({
            spaceId: space.id,
            label: rate.label,
            weekdays: rate.weekdays,
            amount: rate.amount,
            position,
          })),
        });
      }
    });

    return this.publicView(slug);
  }
}
