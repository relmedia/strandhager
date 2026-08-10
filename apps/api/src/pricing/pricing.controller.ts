import { Controller, Get, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { QuotePriceDto } from './dto/quote-price.dto';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get('quote')
  quote(@Query() query: QuotePriceDto) {
    return this.pricing.quote(query.space, query.from, query.to);
  }
}
