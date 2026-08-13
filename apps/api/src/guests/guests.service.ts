import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@cabin/database';

import { toIsoDate } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';

/** Bookings that count as actual stays when summing what a guest has rented for. */
const SPENT_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every guest with the booking figures the list page shows. */
  async findAll() {
    const guests = await this.prisma.guest.findMany({
      include: {
        bookings: {
          select: { startDate: true, endDate: true, status: true, total: true },
          orderBy: { startDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return guests.map((guest) => {
      const { bookings, ...fields } = guest;
      const last = bookings[0];

      return {
        id: fields.id,
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: fields.email,
        phone: fields.phone,
        company: fields.company,
        createdAt: fields.createdAt.toISOString(),
        bookingCount: bookings.length,
        lastStay: last
          ? { startDate: toIsoDate(last.startDate), endDate: toIsoDate(last.endDate) }
          : null,
        totalSpent: bookings
          .filter((booking) => SPENT_STATUSES.includes(booking.status))
          .reduce((sum, booking) => sum + booking.total, 0),
      };
    });
  }

  /** One guest with their full booking history for the detail page. */
  async findOne(id: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { space: { select: { slug: true, name: true } } },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!guest) {
      throw new NotFoundException('Fant ingen gjest med denne id-en');
    }

    return {
      id: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      company: guest.company,
      createdAt: guest.createdAt.toISOString(),
      totalSpent: guest.bookings
        .filter((booking) => SPENT_STATUSES.includes(booking.status))
        .reduce((sum, booking) => sum + booking.total, 0),
      bookings: guest.bookings.map((booking) => ({
        id: booking.id,
        reference: booking.reference,
        startDate: toIsoDate(booking.startDate),
        endDate: toIsoDate(booking.endDate),
        guests: booking.guests,
        purpose: booking.purpose,
        total: booking.total,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        space: { slug: booking.space.slug, name: booking.space.name },
      })),
    };
  }

  async create(dto: CreateGuestDto) {
    const guest = await this.prisma.guest.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone ?? null,
        company: dto.company ?? null,
      },
    });

    return { ...guest, createdAt: guest.createdAt.toISOString() };
  }
}
