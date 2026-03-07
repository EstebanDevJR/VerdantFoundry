import { Controller, Get, Param, Query } from '@nestjs/common';
import { VersioningService } from './versioning.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('versions')
export class VersioningController {
  constructor(private versioningService: VersioningService) {}

  @Get('history')
  getUserHistory(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.versioningService.getUserVersionHistory(userId, limit ? parseInt(limit, 10) : 50);
  }

  @Get(':entityType/:entityId')
  getVersions(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.versioningService.getVersions(entityType, entityId);
  }

  @Get(':entityType/:entityId/:version')
  getVersion(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Param('version') version: string,
  ) {
    return this.versioningService.getVersion(entityType, entityId, parseInt(version, 10));
  }

  @Get(':entityType/:entityId/diff')
  diff(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('from') fromVersion: string,
    @Query('to') toVersion: string,
  ) {
    return this.versioningService.diffVersions(
      entityType,
      entityId,
      parseInt(fromVersion, 10),
      parseInt(toVersion, 10),
    );
  }
}
