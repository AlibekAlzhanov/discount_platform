import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  ConfirmEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/current-user.decorator';

/**
 * Контроллер аутентификации
 * 
 * Все роуты авторизации:
 * - POST /api/auth/register - регистрация
 * - POST /api/auth/login - вход
 * - POST /api/auth/refresh - обновление токенов
 * - POST /api/auth/logout - выход
 * - POST /api/auth/confirm-email - подтверждение email
 * - POST /api/auth/forgot-password - запрос восстановления пароля
 * - POST /api/auth/reset-password - сброс пароля
 * - GET /api/auth/me - получение профиля текущего пользователя
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Регистрация нового пользователя
   * 
   * Rate limit: 5 запросов в 15 минут
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 запросов за 15 минут
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Вход в систему
   * 
   * Rate limit: 5 попыток в 15 минут
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 попыток за 15 минут
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Обновление токенов
   * 
   * Требует валидный refresh token в body
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshAuthGuard)
  async refreshTokens(
    @CurrentUser() user: any,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refreshTokens(
      user.userId,
      refreshTokenDto.refreshToken,
    );
  }

  /**
   * Выход из системы
   * 
   * Требует валидный access token
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user.userId);
  }

  /**
   * Подтверждение email
   * 
   * Rate limit: 10 запросов в 15 минут
   */
  @Public()
  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    return this.authService.confirmEmail(confirmEmailDto.token);
  }

  /**
   * Запрос восстановления пароля
   * 
   * Rate limit: 3 запроса в 15 минут
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 запроса за 15 минут
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * Сброс пароля
   * 
   * Rate limit: 5 запросов в 15 минут
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }

  /**
   * Повторная отправка письма с подтверждением
   * 
   * Rate limit: 3 запроса в 15 минут
   */
  @Public()
  @Post('resend-confirmation')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  async resendConfirmation(@Body() body: { email: string }) {
    return this.authService.resendConfirmationEmail(body.email);
  }

  /**
   * Получение профиля текущего пользователя
   * 
   * Требует валидный access token
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return {
      userId: user.userId,
      email: user.email,
    };
  }
}
