"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Public = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
const common_2 = require("@nestjs/common");
const Public = () => (0, common_2.SetMetadata)('isPublic', true);
exports.Public = Public;
//# sourceMappingURL=current-user.decorator.js.map