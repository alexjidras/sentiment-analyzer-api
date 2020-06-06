import combineRouters from 'koa-combine-routers';
import dictionaryRouter from './dictionary';
import analyzerRouter from './analyzer';
import authRouter from './auth';
import sentenceRouter from './sentence';

export default combineRouters(
    dictionaryRouter,
    analyzerRouter,
    authRouter,
    sentenceRouter
)();