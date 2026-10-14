import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { VippsSettingsController } from './vipps-settings.controller';
import { VippsService } from './vipps.service';
import { TripletexModule } from '../tripletex/tripletex.module';

@Module({
  imports: [NotificationsModule, TripletexModule],
  controllers: [PaymentsController, VippsSettingsController],
  providers: [PaymentsService, VippsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
