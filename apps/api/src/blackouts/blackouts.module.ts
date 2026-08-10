import { Module } from '@nestjs/common';
import { BlackoutsController } from './blackouts.controller';
import { BlackoutsService } from './blackouts.service';
import { SpacesModule } from '../spaces/spaces.module';

@Module({
  imports: [SpacesModule],
  controllers: [BlackoutsController],
  providers: [BlackoutsService],
})
export class BlackoutsModule {}
