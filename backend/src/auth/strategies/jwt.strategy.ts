import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

/**
 * JWT стратегия для access токена
 * 
 * Извлекает JWT из Authorization header и валидирует его
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Валидация payload из JWT токена
   * Автоматически вызывается после успешной верификации токена
   */
  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException('Email не подтверждён');
    }

    // Этот объект будет доступен в request.user
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
