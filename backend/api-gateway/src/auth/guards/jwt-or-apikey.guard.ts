import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../../users/users.service';

const API_KEY_PREFIX_LIVE = 'vf_live_';
const API_KEY_PREFIX_TEST = 'vf_test_';

@Injectable()
export class JwtOrApiKeyAuthGuard extends JwtAuthGuard {
  constructor(
    private reflectorLocal: Reflector,
    private usersService: UsersService,
  ) {
    super(reflectorLocal);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflectorLocal.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { headers: { authorization?: string; 'x-api-key'?: string }; user?: { id: string } }>();
    const authHeader = request.headers?.authorization;
    const xApiKey = request.headers?.['x-api-key'];
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const key = bearer || xApiKey;

    if (key && (key.startsWith(API_KEY_PREFIX_LIVE) || key.startsWith(API_KEY_PREFIX_TEST))) {
      const userId = await this.usersService.validateApiKey(key);
      if (userId) {
        request.user = { id: userId };
        return true;
      }
      throw new UnauthorizedException('Invalid API key');
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
