import chalk from 'chalk';
import mongoose from 'mongoose';
import config from '../config';

class Db {
    static async connect() {
        const MONGODB_URI = process.env.MONGODB_URI || config.db.uri;
        try {
         await mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
        } catch(e) {
            console.error(chalk`{red Unable to connect to database!} \n${e.stack}`);
            process.exit();
        }
    }
    static async disconnect() {
        try {
            mongoose.disconnect();
        } catch(e) {
            console.error(chalk`{red Error while disconnecting:} \n${e.stack}`);
        }
    }
}

export default Db;
