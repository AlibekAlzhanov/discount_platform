"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.setGlobalPrefix('api');
    const allowedOrigins = configService.get('ALLOWED_ORIGINS')?.split(',') || ['http://localhost:19006'];
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
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
//# sourceMappingURL=main.js.map