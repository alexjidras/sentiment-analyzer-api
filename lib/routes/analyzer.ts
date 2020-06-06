import Router from 'koa-router';
import axios from 'axios';
import { Context } from 'koa';
import { isEmpty, setCharAt } from '../utils';
import { Sentence } from '../db/models';

const router = new Router({
    prefix: '/analyzer'
});

router.post('/', async (ctx: Context) => {
    // console.log(JSON.stringify(ctx.dictionary, null, 2))
    if(!ctx.dictionaryLoaded) {
        ctx.throw(500)
    }
    
    if (!ctx.request.rawBody || isEmpty(ctx.request.body)) {
        ctx.throw(400);
    }

    const { input, save } = ctx.request.body;
    
    const formatedInput = input
    .replace(/\bî/g,'â').replace(/ţ/g, 'ț').replace(/Ţ/g, 'Ț').replace(/Ş/g, 'Ș').replace(/ş/g, 'ș').trim();
    const data = {
        sentences: []
    } as any;

    const sentences = formatedInput.split(/[.!]/).filter(sentence => sentence).map(sentence => sentence.trim());

    await Promise.all(sentences.map(async (sentence, i) => {
        const sentenceData = {
            sentence,
            markupSentence: sentence,
            emotions: {}
        } as any;
        
        const originalWords = sentence.match(/[a-zA-ZțȚșȘăĂîÎâÂ]+/g);
        const prenormalizedWords = originalWords.map(word => word.toLowerCase().replace(/\be\b/g, 'fi'));
        
        const normalizedWords = [];
        await Promise.all(prenormalizedWords.map(async (word, wordIndex) => {
            try {
                const normalizedWord = await normalizeWord(word);
                normalizedWords[wordIndex] = normalizedWord;
            } catch(err) {
                console.error(err.stack)
            }
        }))

        var normalizedSentence = normalizedWords.join(' ');
        
        const emotionNames = ['joy', 'surprise', 'disgust', 'fear', 'anger', 'sadness'];
        const posNames = ['v', 'r', 'n', 'a'];
        
        for(var pos of posNames) {
            for(var emotion of emotionNames) {
                const polarity = emotion === 'joy' || emotion === 'surprise' ? 'positive' : 'negative';
                for(var searchedWord of ctx.dictionary['ro'][pos][emotion]) {
                    const searchedWordSentenceIndex = normalizedSentence.search(searchedWord);
                    if(searchedWordSentenceIndex === -1) {
                        continue;
                    }
                    const normalizedWordsStartIndex = getArrayIndex(normalizedWords, searchedWordSentenceIndex);
                    const normalizedWordsEndIndex = normalizedWordsStartIndex + searchedWord.split(' ').length;
                    normalizedSentence = asteriskWord(normalizedSentence, searchedWord, searchedWordSentenceIndex);

                    const originalExpression = originalWords.slice(normalizedWordsStartIndex, normalizedWordsEndIndex).join(' ');
                    
                    if (!sentenceData.emotions[emotion]) {
                        sentenceData.emotions[emotion] = [searchedWord]
                    } else {
                        sentenceData.emotions[emotion].push(searchedWord);
                    }
                    sentenceData.markupSentence = markWord(sentenceData.markupSentence, originalExpression, polarity);
                }
            }
        }
        
        sentenceData.sentenceScore = Object.entries(sentenceData.emotions).reduce((acc, [emotion, words] : any) => {
            if (emotion === 'joy' || emotion === 'surprise') {
                return acc + words.length;
            } else {
                return acc - words.length;
            }
        }, 0);
        
        let sentenceSentiment;
        if (sentenceData.sentenceScore < -1) {
            sentenceSentiment = 'very negative';
        } else if (sentenceData.sentenceScore === -1) {
            sentenceSentiment = 'negative';
        } else if (sentenceData.sentenceScore > 1) {
            sentenceSentiment = 'very positive';
        } else if (sentenceData.sentenceScore === 1) {
            sentenceSentiment = 'positive';
        } else {
            sentenceSentiment = 'neutral';
        }

        sentenceData.sentenceSentiment = sentenceSentiment;
        sentenceData.words = [...originalWords];
        sentenceData.normalizedWord = [...normalizedWords];
        data.sentences[i] = sentenceData;
    }))
    

    data.textScore = data.sentences.reduce((acc, { sentenceScore }) => {
        if (sentenceScore < 0) {
            return acc - 1;
        } else if (sentenceScore > 0) {
            return acc + 1;
        }
        return acc;
    }, 0);
    
    let textSentiment;
    if (data.textScore < 0) {
        textSentiment = 'negative';
    } else if (data.textScore > 0) {
        textSentiment = 'positive';
    } else {
        textSentiment = 'neutral';
    }
    data.textSentiment = textSentiment;
    
    if (ctx.session.userId && save) {
        await Sentence.create({ sentence: formatedInput, result: textSentiment, timestamp: new Date(), userId: ctx.session.userId });
    }
    ctx.body = data;
    ctx.status = 200;
});

const markWord = (sentence, word, tag) => {
    const asteriskedSentence = asteriskWordsWithinTags(sentence);
    const wordSentenceIndex = asteriskedSentence.search(word);
    if (wordSentenceIndex === -1) {
        console.error(`Word '${word}' not found in sentence '${sentence}'`);
        return sentence;
    }
    const taggedSentence = tagWordAt(sentence, wordSentenceIndex, word, tag);
    return taggedSentence;
}

const tagWordAt = (sentence, index, word, tag) => (
    sentence.slice(0, index) + `<${tag}>` + word + `</${tag}>` + sentence.slice(index + word.length)
);

const asteriskWordsWithinTags = (sentence) => {
    while(1) {
        const tagStartIndex = sentence.search('<');
        if(tagStartIndex === -1) {
            break;
        }
        sentence = sentence.slice(0, tagStartIndex) + '**********' + sentence.slice(tagStartIndex + 10);
        const tagEndIndex = sentence.search('</');
        const asteriskedWord = sentence.slice(tagStartIndex + 10, tagEndIndex).replace(/./g, '*');
        sentence = sentence.slice(0, tagStartIndex + 10) + asteriskedWord + sentence.slice(tagEndIndex);
        sentence = sentence.slice(0, tagEndIndex) + '***********' + sentence.slice(tagEndIndex + 11);
    }
    return sentence;
}

const asteriskWord = (sentence, word, wordIndex) => {
    for (var i = wordIndex; i < wordIndex + word.length; i++) {
        sentence = setCharAt(sentence, i, '*');
    }
    return sentence;
}

const getArrayIndex = (array, sentenceIndex) => {
    var letterCount = 0;
    for(var index in array) {
        if(letterCount === sentenceIndex) {
            return +index;
        }
        letterCount+= array[index].length + 1;
    }
}

const normalizeWord = (word:string) => {
    if (word.length < 2) {
        return word;
    }
    return axios.get(`https://dexonline.ro/definitie-dex09/${encodeURIComponent(word)}/json`)
        .then(body => {
            if(!body.data.definitions.length) {
                return word;
            } else {
                let finalWord = body.data.definitions[0].internalRep.match(/@[A-ZȚȘÎÂĂÉÁẤÎ́ÍÚÓ]+,?@?/)[0].replace(/[@,]/g, '');
                for (let i in finalWord) {
                    if (finalWord[i] === 'Á') {
                        finalWord = setCharAt(finalWord, i, 'a');
                        break;
                    } else if (finalWord[i] === 'Ấ') {
                        finalWord = setCharAt(finalWord, i, 'â');
                        break;
                    } else if (finalWord[i] === 'Î') {
                        finalWord = finalWord.replace("Î" + "́", 'î')
                        break;
                    } else if (finalWord[i] === 'É') {
                        finalWord = setCharAt(finalWord, i, 'e');
                        break;
                    } else if (finalWord[i] === 'Í') {
                        finalWord = setCharAt(finalWord, i, 'i');
                        break;
                    } else if (finalWord[i] === 'Ú') {
                        finalWord = setCharAt(finalWord, i, 'u');
                        break;
                    } else if (finalWord[i] === 'Ó') {
                        finalWord = setCharAt(finalWord, i, 'o');
                        break;
                    }
                }
                return finalWord.toLowerCase().replace(/\bî/g,'â')
            }
            
        })
}

export default router;