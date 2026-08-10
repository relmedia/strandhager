import { Body, Controller, Get, Patch, Post } from '@nestjs/common';

import { TestEmailDto, UpdateMailSettingsDto } from './dto/mail-settings.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('settings')
  getSettings() {
    return this.notifications.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdateMailSettingsDto) {
    return this.notifications.updateSettings(dto);
  }

  /** Sends a test email so the setup can be checked from the dashboard. */
  @Post('test')
  sendTest(@Body() dto: TestEmailDto) {
    return this.notifications.sendTest(dto.to);
  }
}
