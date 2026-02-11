import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * Сервис для управления пользователями
 * 
 * Основные функции:
 * - Создание пользователей с хэшированием паролей
 * - Поиск пользователей
 * - Управление токенами подтверждения и восстановления
 * - Обновление refresh токенов
 */
@Injectable()
export class UsersService {
  // Количество раундов хэширования bcrypt (чем больше, тем безопаснее, но медленнее)
  private readonly SALT_ROUNDS = 10;

  // Максимальное количество неудачных попыток входа
  private readonly MAX_LOGIN_ATTEMPTS = 5;

  // Время блокировки после превышения попыток (2 часа)
  private readonly LOCK_TIME = 2 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Создать нового пользователя
   * @param createUserDto - данные для создания
   * @returns созданный пользователь
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
  const existingUser = await this.findByEmail(createUserDto.email);
  if (existingUser) {
    throw new ConflictException('Пользователь с таким email уже существует');
  }

  const hashedPassword = await this.hashPassword(createUserDto.password);

  const { token, hashedToken, expiresAt } = this.generateToken();

  const user = this.usersRepository.create({
    ...createUserDto,
    password: hashedPassword,
    emailConfirmationToken: hashedToken,
    emailConfirmationExpires: expiresAt,
  });

  const savedUser = await this.usersRepository.save(user);

  // ⚡ Исправление: добавляем поле token без создания plain object
  Object.assign(savedUser, { emailConfirmationToken: token });

  return savedUser;
}


  /**
   * Найти пользователя по email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Найти пользователя по ID
   */
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * Подтвердить email пользователя
   * @param token - токен подтверждения из email
   */
  async confirmEmail(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);

    const user = await this.usersRepository.findOne({
      where: {
        emailConfirmationToken: hashedToken,
      },
    });

    if (!user) {
      throw new NotFoundException('Токен подтверждения недействителен');
    }

    // Проверка срока действия токена
    if (user.emailConfirmationExpires < new Date()) {
      throw new ConflictException('Токен подтверждения истёк');
    }

    // Подтверждение email
    user.isEmailConfirmed = true;
    user.emailConfirmationToken = null;
    user.emailConfirmationExpires = null;

    await this.usersRepository.save(user);
  }

  /**
   * Создать токен для сброса пароля
   * @param email - email пользователя
   * @returns токен для отправки на email
   */
  async createPasswordResetToken(email: string): Promise<string> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (!user.isEmailConfirmed) {
      throw new ConflictException('Email не подтверждён');
    }

    const { token, hashedToken, expiresAt } = this.generateToken();

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;

    await this.usersRepository.save(user);

    return token;
  }

  /**
   * Сбросить пароль
   * @param token - токен сброса
   * @param newPassword - новый пароль
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = this.hashToken(token);

    const user = await this.usersRepository.findOne({
      where: {
        passwordResetToken: hashedToken,
      },
    });

    if (!user) {
      throw new NotFoundException('Токен сброса пароля недействителен');
    }

    if (user.passwordResetExpires < new Date()) {
      throw new ConflictException('Токен сброса пароля истёк');
    }

    // Установка нового пароля
    user.password = await this.hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    // Сброс счётчика попыток входа
    user.loginAttempts = 0;
    user.lockUntil = null;

    await this.usersRepository.save(user);
  }

  /**
   * Обновить refresh token
   */
  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const hashedRefreshToken = refreshToken ? await this.hashPassword(refreshToken) : null;

    await this.usersRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  /**
   * Увеличить счётчик неудачных попыток входа
   */
  async incrementLoginAttempts(userId: string): Promise<void> {
    const user = await this.findById(userId);

    if (!user) return;

    const updates: Partial<User> = {
      loginAttempts: user.loginAttempts + 1,
    };

    // Блокировка после превышения лимита
    if (user.loginAttempts + 1 >= this.MAX_LOGIN_ATTEMPTS) {
      updates.lockUntil = new Date(Date.now() + this.LOCK_TIME);
    }

    await this.usersRepository.update(userId, updates);
  }

  /**
   * Сбросить счётчик попыток входа после успешной авторизации
   */
  async resetLoginAttempts(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      loginAttempts: 0,
      lockUntil: null,
    });
  }

  /**
   * Хэширование пароля с помощью bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Генерация случайного токена
   * @returns объект с оригинальным токеном, хэшем и датой истечения
   */
  private generateToken(): { token: string; hashedToken: string; expiresAt: Date } {
    // Генерируем криптографически стойкий случайный токен
    const token = crypto.randomBytes(32).toString('hex');

    // Хэшируем токен для безопасного хранения в БД
    const hashedToken = this.hashToken(token);

    // Токен действителен 24 часа
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return { token, hashedToken, expiresAt };
  }

  /**
   * Хэширование токена (для безопасного сравнения)
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
