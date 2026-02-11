import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * Точка входа в приложение
 * 
 * Настраивает:
 * - CORS для безопасного доступа с фронтенда
 * - Глобальную валидацию данных
 * - Префикс API
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Глобальный префикс для всех API endpoints
  app.setGlobalPrefix('api');

  // CORS - настройка безопасного доступа
  // ВАЖНО: В продакшене указать точные домены, а не '*'
  const allowedOrigins = configService.get('ALLOWED_ORIGINS')?.split(',') || ['http://localhost:19006'];
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true, // Разрешить отправку cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Глобальная валидация входящих данных
  // whitelist: удалять поля, которых нет в DTO
  // forbidNonWhitelisted: выбрасывать ошибку при наличии лишних полей
  // transform: автоматически преобразовывать типы
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🚀 Discount Platform API запущен!          ║
  ║                                               ║
  ║   📡 URL: http://localhost:${port}/api         ║
  ║   🌍 Env: ${configService.get('NODE_ENV')}   ║
  ║   🗄️  DB:  PostgreSQL                         ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
}

bootstrap();
