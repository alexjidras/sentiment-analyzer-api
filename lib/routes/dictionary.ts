import Router from 'koa-router';
import fs from 'fs';
import util from 'util';
import { stripExt } from '../utils';

const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

const router = new Router({
    prefix: '/dictionary'
});

router.get('/load', async ctx => {
    ctx.app.context.dictionary = {
        ro: {}
    };
    const files = await readdir('res/dictionary');

    for (const file of files) {
        const data = await readFile(`res/dictionary/${file}`, 'utf8');
        const fileName = stripExt(file);
        
        const lines = data.split(/\r?\n/);

        lines.forEach((line) => {
            //strip BOM
            if (line.startsWith('\uFEFF')) {
                line = line.substring(1);
            }

            if(!line.length) {
                return;
            }

            const pos = line.substring(0,1);
            const tabGroups = line.split('\t');

            let words = tabGroups[4].split(' ');
            words = words.filter(w => w.length);

            if(pos === 'v') {
                words.forEach((word, i) => {
                    // înlăturăm construcțiile verbului
                    words[i] = word.replace(/(\[?se\]?)|(\ba(-şi)?)_/g, '')
                });
            }

            words.forEach((word, i) => {
                // replace old symbols with modern ones and underscores with ' '
                words[i] = word.replace(/_/g, ' ').replace(/\bî/g,'â').replace(/ţ/g, 'ț').replace(/ş/g, 'ș').trim()
            });
            

            if (!ctx.app.context.dictionary.ro[pos]) {
                ctx.app.context.dictionary.ro[pos] = {};
            }
            if(!ctx.app.context.dictionary.ro[pos][fileName]) {
                ctx.app.context.dictionary.ro[pos][fileName] = [];
            }
            ctx.app.context.dictionary.ro[pos][fileName].push(...words);
        });
    }
    ctx.app.context.dictionaryLoaded = true;
    ctx.status = 200;
    //console.log(JSON.stringify(ctx.app.context.dictionary, null, 2))
});

router.get('/unload', ctx => {
    ctx.app.context.dictionary = null;
    ctx.app.context.dictionaryLoaded = false;
})

export default router;