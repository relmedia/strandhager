import { Injectable } from '@nestjs/common';

import { DEFAULT_LANDLORD, type Landlord } from '../bookings/landlord';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateOrgSettingsDto } from './dto/update-org-settings.dto';

/** There is one association, so one row. */
const ID = 'default';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The organisation settings, creating them from the built-in values the first
   * time anybody asks. That keeps the dashboard from having to show an empty
   * form before the board has saved anything.
   */
  async organisation() {
    const existing = await this.prisma.orgSettings.findUnique({ where: { id: ID } });
    if (existing) return toView(existing);

    const created = await this.prisma.orgSettings.create({
      data: {
        id: ID,
        landlordName: DEFAULT_LANDLORD.name,
        landlordLines: DEFAULT_LANDLORD.lines,
      },
    });

    return toView(created);
  }

  async updateOrganisation(dto: UpdateOrgSettingsDto) {
    // Read first, so a patch touching only one field keeps the other.
    const current = await this.organisation();

    const landlordName = dto.landlordName?.trim() || current.landlord.name;
    const landlordLines = dto.landlordLines
      ? dto.landlordLines.map((line) => line.trim()).filter(Boolean)
      : current.landlord.lines;

    const saved = await this.prisma.orgSettings.update({
      where: { id: ID },
      data: { landlordName, landlordLines },
    });

    return toView(saved);
  }

  /**
   * What a booking created right now should record as its utleier.
   *
   * Returned rather than read live at render time so each agreement keeps the
   * wording it was made under; see the comment on Booking.landlordName.
   */
  async landlordForNewBooking(): Promise<Landlord> {
    const { landlord } = await this.organisation();
    return landlord;
  }
}

function toView(row: { landlordName: string; landlordLines: string[]; updatedAt: Date }) {
  return {
    landlord: { name: row.landlordName, lines: row.landlordLines },
    updatedAt: row.updatedAt.toISOString(),
  };
}
