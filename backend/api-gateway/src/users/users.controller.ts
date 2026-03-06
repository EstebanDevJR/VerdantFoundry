import { Controller, Get, Put, Post, Delete, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Get('me/api-keys')
  getApiKeys(@CurrentUser('id') userId: string) {
    return this.usersService.getApiKeys(userId);
  }

  @Post('me/api-keys')
  createApiKey(
    @CurrentUser('id') userId: string,
    @Body() body: { name: string; prefix?: 'vf_live' | 'vf_test' },
  ) {
    return this.usersService.createApiKey(userId, body.name, body.prefix ?? 'vf_test');
  }

  @Delete('me/api-keys/:id')
  revokeApiKey(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.usersService.revokeApiKey(userId, id);
  }

  @Put('me')
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() body: { firstName?: string; lastName?: string },
  ) {
    return this.usersService.updateMe(userId, body);
  }
}
