import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { VippsService } from './vipps.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, VippsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
