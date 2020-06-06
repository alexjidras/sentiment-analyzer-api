import Router from 'koa-router';
import { Context } from 'koa';
import { User } from '../db/models';

const router = new Router({
    prefix: '/auth'
});

router.post('/login', async (ctx: Context) => {
    const { email, password } = ctx.request.body;
    
    const user = await User.findOne({ email, password }).exec();
    if (!user) {
        ctx.status = 400;
        ctx.body = 'Invalid credentials';
        return;
    }

    ctx.session.userId = user._id;
    ctx.body = {
        email,
        name: user.name
    }
});

router.get('/user', async (ctx: Context) => {
    if (!ctx.session.userId) {
        ctx.body = null;
        return;
    }
    const user = await User.findById(ctx.session.userId).exec();
    if (!user) {
        ctx.body = null;
        return;
    }

    ctx.body = {
        email: user.email,
        name: user.name
    }
});

router.post('/register', async (ctx: Context) => {
    const { email, name, password } = ctx.request.body;
    
    const user = await User.findOne({ email }).exec();
    if (user) {
        ctx.body = 'Email already in use';
        ctx.status = 400;
        return;
    }

    const newUser = await User.create({ email, name, password });

    ctx.session.userId = newUser._id;
    ctx.body = {
        email,
        name
    }
});

router.post('/logout', (ctx: Context) => {
    if (!ctx.session.userId) {
        ctx.body = 'You are not logged in';
        ctx.status = 400;
        return;
    }

    
    delete ctx.session.userId;  
    ctx.status = 200;
});

export default router;