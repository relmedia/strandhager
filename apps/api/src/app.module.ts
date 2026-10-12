import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ThrottleModule } from './common/throttle.module';
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
import { PaymentsModule } from './payments/payments.module';
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
    ThrottleModule,
    HealthModule,
    AuthModule,
    CabinsModule,
    SpacesModule,
    BookingsModule,
    GuestsModule,
    AvailabilityModule,
    BlackoutsModule,
    ParcelsModule,
    PaymentsModule,
    PricingModule,
    CmsModule,
    SiteContentModule,
    MediaModule,
    NotificationsModule,
    ContactModule,
  ],
  providers: [
    // Closed by default: every route needs a dashboard token unless it is
    // marked @Public(). A new controller is therefore protected from the
    // moment it exists, rather than from the moment someone remembers.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
