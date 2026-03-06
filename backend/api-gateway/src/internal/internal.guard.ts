import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';

@Injectable()
export class InternalGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const key = request.headers['x-internal-key'] as string | undefined;
    const secret = this.config.get<string>('INTERNAL_API_SECRET');
    if (!secret || key !== secret) {
      throw new UnauthorizedException('Invalid internal API key');
    }
    return true;
  }
}
