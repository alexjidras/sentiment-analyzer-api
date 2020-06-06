import Router from 'koa-router';
import { Context } from 'koa';
import { authenticate } from '../middlewares';
import { Sentence } from '../db/models';

const router = new Router({
    prefix: '/sentences'
});

router.get('/', authenticate, async (ctx: Context) => {
    const sentences = await Sentence.find({ userId: ctx.session.userId }).exec();
    ctx.body = sentences;
});

router.delete('/:id', authenticate, async (ctx: Context) => {
    const { id } = ctx.params;
    console.log(id)
    const sentence = await Sentence.findOneAndDelete({ _id: id, userId: ctx.session.userId }).exec();
    if (!sentence) {
        ctx.status = 400;
        return;
    }
    ctx.status = 200;
})

export default router;