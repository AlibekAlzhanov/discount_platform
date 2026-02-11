import { Module } from '@nestjs/common';

/**
 * Модуль конфигурации базы данных
 * 
 * В данный момент пустой, т.к. TypeORM настраивается в AppModule
 * Можно использовать для дополнительных утилит работы с БД
 */
@Module({})
export class DatabaseModule {}
