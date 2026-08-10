import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { OwnershipsController } from './ownerships.controller';
import { OwnershipsService } from './ownerships.service';
import { ParcellantsController } from './parcellants.controller';
import { ParcellantsService } from './parcellants.service';
import { ParcelsController } from './parcels.controller';
import { ParcelsService } from './parcels.service';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';

/** The parcels, the people who own them, and the queue for the next free one. */
@Module({
  imports: [NotificationsModule],
  controllers: [
    ParcelsController,
    ParcellantsController,
    OwnershipsController,
    WaitlistController,
  ],
  providers: [ParcelsService, ParcellantsService, OwnershipsService, WaitlistService],
})
export class ParcelsModule {}
