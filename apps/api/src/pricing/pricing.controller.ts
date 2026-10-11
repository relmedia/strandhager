import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { QuotePriceBodyDto, QuotePriceDto } from './dto/quote-price.dto';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get('quote')
  quote(@Query() query: QuotePriceDto) {
    return this.pricing.quote(query.space, query.from, query.to, query.setup);
  }

  /**
   * The same price, with the booker's email in the body so the members'
   * discount can be worked out without putting the address in the URL.
   *
   * The response is only ever a price. It never says whether the email matched
   * anyone, so this cannot be used to read the owner register — the most it
   * reveals is the number a quote came to.
   */
  @Post('quote')
  @HttpCode(200)
  quoteFor(@Body() body: QuotePriceBodyDto) {
    return this.pricing.quote(
      body.space,
      body.from,
      body.to,
      body.setup,
      body.email,
    );
  }
}
