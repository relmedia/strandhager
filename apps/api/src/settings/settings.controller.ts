import { Body, Controller, Get, Patch } from '@nestjs/common';

import { UpdateOrgSettingsDto } from './dto/update-org-settings.dto';
import { SettingsService } from './settings.service';

/**
 * Dashboard-only. No route here is marked @Public(), so the global JWT guard
 * covers the lot — which is what keeps organisation settings off the public
 * website, unlike the site-content store.
 */
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('organisation')
  organisation() {
    return this.settings.organisation();
  }

  @Patch('organisation')
  updateOrganisation(@Body() dto: UpdateOrgSettingsDto) {
    return this.settings.updateOrganisation(dto);
  }
}
