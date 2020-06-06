import Koa from 'koa';
import logger from 'koa-morgan';
import chalk from 'chalk';
import session from 'koa-session';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import config from './config';
import * as middlewares from './middlewares';
import router from './routes';
import db from './db';

const app = new Koa();

app.keys = [config.server.key];

db.connect();
app.context.dictionary = null;
app.context.dictionaryLoaded = false;

app.use(logger(config.logger.mode));
app.use(cors({
    credentials: true
}));
app.use(session({
    key: config.server.session.key,
}, app));
app.use(bodyParser());

app.use(middlewares.error);
app.use(router);

app.listen(config.server.port, () => {
    console.log(chalk`{blue Server is listening on }{cyan.underline http://localhost:${config.server.port}}`)
})