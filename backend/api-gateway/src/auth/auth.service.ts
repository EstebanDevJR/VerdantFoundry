import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    return this.generateTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(sub: string, email: string) {
    const expiresInSec = 15 * 60; // 15 min default
    const refreshExpiresInSec = 7 * 24 * 60 * 60; // 7 days default
    const accessToken = this.jwtService.sign({ sub, email }, { expiresIn: expiresInSec });
    const refreshToken = this.jwtService.sign(
      { sub, type: 'refresh' },
      { secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret', expiresIn: refreshExpiresInSec },
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSec,
    };
  }
}
