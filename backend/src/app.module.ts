import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { DatabaseModule } from './database/database.module';

/**
 * Главный модуль приложения
 * 
 * Импортирует и настраивает все основные модули:
 * - ConfigModule: управление конфигурацией через .env
 * - TypeOrmModule: ORM для работы с PostgreSQL
 * - ThrottlerModule: защита от brute-force атак
 * - AuthModule: аутентификация и авторизация
 * - UsersModule: управление пользователями
 * - MailModule: отправка email
 */
@Module({
  imports: [
    // Глобальная конфигурация из .env файла
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Подключение к PostgreSQL через TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development', // ВАЖНО: в продакшене использовать миграции!
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),

    // Rate limiting - защита от DDoS и brute-force атак
    // Глобально ограничиваем количество запросов
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 секунд
      limit: 100, // максимум 100 запросов за 60 секунд
    }]),

    // Модуль базы данных (конфигурация TypeORM)
    DatabaseModule,

    // Модуль пользователей
    UsersModule,

    // Модуль аутентификации
    AuthModule,

    // Модуль отправки email
    MailModule,
  ],
})
export class AppModule {}
