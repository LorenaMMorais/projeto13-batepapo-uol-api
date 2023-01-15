import {MongoClient} from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const mongoCilent = new MongoClient(process.env.MONGO_URI);

await mongoClient.connect();

const db = mongoClient.db('projeto13-batepapo-uol-api');

export default db;