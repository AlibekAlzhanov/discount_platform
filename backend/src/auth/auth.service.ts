import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/auth.dto';

/**
 * Сервис аутентификации и авторизации
 * 
 * Основные функции:
 * - Регистрация пользователей
 * - Вход в систему
 * - Обновление токенов
 * - Подтверждение email
 * - Восстановление пароля
 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  /**
   * Регистрация нового пользователя
   * @param createUserDto - данные для регистрации
   * @returns access и refresh токены
   */
  async register(createUserDto: CreateUserDto) {
    // Создаём пользователя (пароль хэшируется в UsersService)
    const user = await this.usersService.create(createUserDto);

    // Отправляем email с подтверждением
    await this.mailService.sendEmailConfirmation(
      user.email,
      user.emailConfirmationToken,
      user.firstName,
    );

    // Возвращаем сообщение о необходимости подтверждения
    return {
      message: 'Регистрация успешна! Проверьте email для подтверждения аккаунта.',
      email: user.email,
    };
  }

  /**
   * Вход в систему
   * @param loginDto - email и пароль
   * @returns access и refresh токены
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Поиск пользователя
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Проверка блокировки аккаунта
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / 1000 / 60,
      );
      throw new UnauthorizedException(
        `Аккаунт временно заблокирован. Попробуйте снова через ${lockTimeRemaining} минут.`,
      );
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Увеличиваем счётчик неудачных попыток
      await this.usersService.incrementLoginAttempts(user.id);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Проверка подтверждения email
    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException(
        'Email не подтверждён. Проверьте почту и подтвердите регистрацию.',
      );
    }

    // Сброс счётчика попыток входа
    await this.usersService.resetLoginAttempts(user.id);

    // Генерация токенов
    const tokens = await this.generateTokens(user.id, user.email);

    // Сохранение refresh токена в БД
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Обновление access токена с помощью refresh токена
   * @param userId - ID пользователя
   * @param refreshToken - refresh токен
   * @returns новые access и refresh токены
   */
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Доступ запрещён');
    }

    // Проверка refresh токена
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Доступ запрещён');
    }

    // Генерация новых токенов
    const tokens = await this.generateTokens(user.id, user.email);

    // Обновление refresh токена в БД
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Выход из системы
   * @param userId - ID пользователя
   */
  async logout(userId: string) {
    // Удаляем refresh токен из БД
    await this.usersService.updateRefreshToken(userId, null);

    return { message: 'Вы успешно вышли из системы' };
  }

  /**
   * Подтверждение email
   * @param token - токен подтверждения
   */
  async confirmEmail(token: string) {
    await this.usersService.confirmEmail(token);

    return { message: 'Email успешно подтверждён! Теперь вы можете войти в систему.' };
  }

  /**
   * Запрос на восстановление пароля
   * @param email - email пользователя
   */
  async forgotPassword(email: string) {
    try {
      const token = await this.usersService.createPasswordResetToken(email);

      const user = await this.usersService.findByEmail(email);

      await this.mailService.sendPasswordReset(
        email,
        token,
        user.firstName,
      );

      return {
        message: 'Инструкции по восстановлению пароля отправлены на email',
      };
    } catch (error) {
      // Не раскрываем информацию о существовании email
      return {
        message: 'Если email зарегистрирован, инструкции будут отправлены',
      };
    }
  }

  /**
   * Сброс пароля
   * @param token - токен сброса
   * @param newPassword - новый пароль
   */
  async resetPassword(token: string, newPassword: string) {
    await this.usersService.resetPassword(token, newPassword);

    return { message: 'Пароль успешно изменён! Теперь вы можете войти с новым паролем.' };
  }

  /**
   * Повторная отправка письма с подтверждением
   * @param email - email пользователя
   */
  async resendConfirmationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    if (user.isEmailConfirmed) {
      throw new ConflictException('Email уже подтверждён');
    }

    // Генерируем новый токен, если старый истёк
    // (в реальном проекте можно создать отдельный метод в UsersService)
    
    await this.mailService.sendEmailConfirmation(
      user.email,
      user.emailConfirmationToken,
      user.firstName,
    );

    return { message: 'Письмо с подтверждением отправлено повторно' };
  }

  /**
   * Генерация access и refresh токенов
   * @param userId - ID пользователя
   * @param email - email пользователя
   */
  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
