import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { BlackoutsModule } from './blackouts/blackouts.module';
import { BookingsModule } from './bookings/bookings.module';
import { CabinsModule } from './cabins/cabins.module';
import { CmsModule } from './cms/cms.module';
import { ContactModule } from './contact/contact.module';
import { GuestsModule } from './guests/guests.module';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ParcelsModule } from './parcels/parcels.module';
import { PricingModule } from './pricing/pricing.module';
import { PrismaModule } from './prisma/prisma.module';
import { SiteContentModule } from './site-content/site-content.module';
import { SpacesModule } from './spaces/spaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CabinsModule,
    SpacesModule,
    BookingsModule,
    GuestsModule,
    AvailabilityModule,
    BlackoutsModule,
    ParcelsModule,
    PricingModule,
    CmsModule,
    SiteContentModule,
    MediaModule,
    NotificationsModule,
    ContactModule,
  ],
})
export class AppModule {}
