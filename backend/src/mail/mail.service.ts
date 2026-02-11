import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

/**
 * Сервис для отправки email
 * 
 * Поддерживает:
 * - SMTP (Gmail, Outlook, и т.д.)
 * - HTML шаблоны через Handlebars
 * - Подтверждение email
 * - Восстановление пароля
 */
@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Инициализация SMTP транспорта
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: false, // true для 465, false для других портов
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  /**
   * Отправить email подтверждения регистрации
   * @param email - адрес получателя
   * @param token - токен подтверждения
   * @param userName - имя пользователя
   */
  async sendEmailConfirmation(email: string, token: string, userName?: string): Promise<void> {
    const confirmUrl = `${this.configService.get('CLIENT_URL')}/confirm-email?token=${token}`;

    const html = this.renderTemplate('email-confirmation', {
      userName: userName || 'Пользователь',
      confirmUrl,
      appName: 'Discount Platform',
    });

    await this.sendMail({
      to: email,
      subject: 'Подтверждение email',
      html,
    });
  }

  /**
   * Отправить email для восстановления пароля
   * @param email - адрес получателя
   * @param token - токен восстановления
   * @param userName - имя пользователя
   */
  async sendPasswordReset(email: string, token: string, userName?: string): Promise<void> {
    const resetUrl = `${this.configService.get('CLIENT_URL')}/reset-password?token=${token}`;

    const html = this.renderTemplate('password-reset', {
      userName: userName || 'Пользователь',
      resetUrl,
      appName: 'Discount Platform',
      expirationTime: '24 часа',
    });

    await this.sendMail({
      to: email,
      subject: 'Восстановление пароля',
      html,
    });
  }

  /**
   * Базовый метод отправки email
   */
  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM'),
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`✉️  Email отправлен на ${options.to}`);
    } catch (error) {
      console.error('❌ Ошибка отправки email:', error);
      throw error;
    }
  }

  /**
   * Рендер HTML шаблона с помощью Handlebars
   * @param templateName - имя шаблона
   * @param context - данные для шаблона
   */
  private renderTemplate(templateName: string, context: any): string {
    const templatesPath = path.join(__dirname, 'templates');
    const templatePath = path.join(templatesPath, `${templateName}.hbs`);

    // Для разработки используем встроенные шаблоны
    // В продакшене можно читать из файлов
    let templateSource: string;

    if (fs.existsSync(templatePath)) {
      templateSource = fs.readFileSync(templatePath, 'utf-8');
    } else {
      // Встроенные шаблоны
      templateSource = this.getBuiltInTemplate(templateName);
    }

    const template = handlebars.compile(templateSource);
    return template(context);
  }

  /**
   * Встроенные HTML шаблоны
   */
  private getBuiltInTemplate(templateName: string): string {
    const templates = {
      'email-confirmation': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{{appName}}</h1>
            </div>
            <div class="content">
              <h2>Привет, {{userName}}! 👋</h2>
              <p>Спасибо за регистрацию в {{appName}}!</p>
              <p>Для завершения регистрации, пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:</p>
              <p style="text-align: center;">
                <a href="{{confirmUrl}}" class="button">Подтвердить Email</a>
              </p>
              <p style="color: #666; font-size: 14px;">
                Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br>
                <a href="{{confirmUrl}}">{{confirmUrl}}</a>
              </p>
              <p style="color: #999; font-size: 12px;">
                Если вы не регистрировались в {{appName}}, просто проигнорируйте это письмо.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2026 {{appName}}. Все права защищены.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'password-reset': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{{appName}}</h1>
            </div>
            <div class="content">
              <h2>Восстановление пароля 🔐</h2>
              <p>Привет, {{userName}}!</p>
              <p>Мы получили запрос на восстановление пароля для вашего аккаунта.</p>
              <p>Нажмите на кнопку ниже, чтобы создать новый пароль:</p>
              <p style="text-align: center;">
                <a href="{{resetUrl}}" class="button">Сбросить пароль</a>
              </p>
              <div class="warning">
                <strong>⚠️ Важно:</strong> Эта ссылка действительна только {{expirationTime}}. После этого вам нужно будет запросить восстановление пароля снова.
              </div>
              <p style="color: #666; font-size: 14px;">
                Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br>
                <a href="{{resetUrl}}">{{resetUrl}}</a>
              </p>
              <p style="color: #999; font-size: 12px;">
                Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо. Ваш пароль останется без изменений.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2026 {{appName}}. Все права защищены.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return templates[templateName] || '<p>Template not found</p>';
  }
}
