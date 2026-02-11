import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Декоратор для получения текущего пользователя из request
 * 
 * Использование:
 * @Get('profile')
 * getProfile(@CurrentUser() user) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Декоратор для публичных роутов (без авторизации)
 * 
 * Использование:
 * @Public()
 * @Post('login')
 * login() { ... }
 */
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata('isPublic', true);
