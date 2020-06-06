import { Context } from 'koa';

export default async (ctx: Context, next) => {
    if (ctx.session.userId) {
        await next();
    } else {
        ctx.throw(401, 'Unauthorized');
    }
}