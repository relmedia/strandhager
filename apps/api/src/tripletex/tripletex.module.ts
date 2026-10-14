import { Module } from '@nestjs/common';

import { TripletexClient } from './tripletex.client';
import { TripletexController } from './tripletex.controller';
import { TripletexService } from './tripletex.service';

@Module({
  controllers: [TripletexController],
  providers: [TripletexClient, TripletexService],
  exports: [TripletexService],
})
export class TripletexModule {}
