"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const handlebars = require("handlebars");
let MailService = class MailService {
    constructor(configService) {
        this.configService = configService;
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST'),
            port: this.configService.get('MAIL_PORT'),
            secure: false,
            auth: {
                user: this.configService.get('MAIL_USER'),
                pass: this.configService.get('MAIL_PASSWORD'),
            },
        });
    }
    async sendEmailConfirmation(email, token, userName) {
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
    async sendPasswordReset(email, token, userName) {
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
    async sendMail(options) {
        try {
            await this.transporter.sendMail({
                from: this.configService.get('MAIL_FROM'),
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            console.log(`✉️  Email отправлен на ${options.to}`);
        }
        catch (error) {
            console.error('❌ Ошибка отправки email:', error);
            throw error;
        }
    }
    renderTemplate(templateName, context) {
        const templatesPath = path.join(__dirname, 'templates');
        const templatePath = path.join(templatesPath, `${templateName}.hbs`);
        let templateSource;
        if (fs.existsSync(templatePath)) {
            templateSource = fs.readFileSync(templatePath, 'utf-8');
        }
        else {
            templateSource = this.getBuiltInTemplate(templateName);
        }
        const template = handlebars.compile(templateSource);
        return template(context);
    }
    getBuiltInTemplate(templateName) {
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
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map