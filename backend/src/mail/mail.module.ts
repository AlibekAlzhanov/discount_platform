import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * Модуль для отправки email
 */
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
