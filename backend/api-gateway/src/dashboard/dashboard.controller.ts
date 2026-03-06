import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.dashboardService.getStats(userId);
  }

  @Get('activity')
  getActivity(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.dashboardService.getActivity(userId, limit ? parseInt(limit, 10) : 10);
  }

  @Get('performance')
  getPerformance(@Query('period') period?: string) {
    return this.dashboardService.getPerformance(period);
  }

  @Get('tool-usage')
  getToolUsage(@CurrentUser('id') userId: string) {
    return this.dashboardService.getToolUsage(userId);
  }

  @Get('health')
  getHealth() {
    return this.dashboardService.getHealth();
  }
}
