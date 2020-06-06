import { ParameterizedContext } from 'koa';

interface IAppContext extends ParameterizedContext {
    dictionary: object,
    dictionaryLoaded: boolean
}

const isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
}
const stripExt = (file) => file.replace(/\.(txt)/, '');
const setCharAt = (str, index, char) => str.substring(0, index) + char + str.substring(+index + 1);
const isEmail = (v:string) => /\S+@\S+\.\S+/.test(v);

export { IAppContext, isEmpty, stripExt, setCharAt, isEmail };