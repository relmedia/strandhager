import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { SpacesModule } from '../spaces/spaces.module';
import { PricingModule } from '../pricing/pricing.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SpacesModule, NotificationsModule, PaymentsModule, PricingModule, SettingsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
