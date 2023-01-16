import express, {json} from 'express';
import cors from 'cors';
import {MongoClient} from 'mongodb';
import dotenv from 'dotenv';
//import joi from 'joi';
import chalk from 'chalk';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(json());

const mongoClient = new MongoClient(process.env.DATABASE_URL);

let db;

mongoClient.connect()
    .then(() => {
        db = mongoClient.db('projeto13-batepapo-uol-api');
        console.log(chalk.green.bold('Banco conectado')); 
    })
    .catch(() => 
        console.log(chalk.red.bold('Banco não conectou'))
    )

const messages = [];

app.post('/participants', async (req,res) => {
    const {name} = req.body;
    
    try{
        await db.collection('participants').insertOne({
            name: name,
            lastStatus: Date.now()
        });
        res.sendStatus(201);
    } catch(error){
        res.status(422).send('Não foi possível cadastrar o participante');
    }
});

app.get('/participants', (req, res) => {
    try{
        const participants = db.collection('participants').find({}).toArray();
        res.send(participants);
    } catch(error){
        res.status(500).send('Não foi possível obter participantes');
    }
});

app.post('/messages', async (req, res) => {
    const {to, text, type} = req.body; 
    const message = {
        to: 'Todos', 
        text: 'oi galera', 
        type: 'message', 
    };
    messages.push(message);
    res.sendStatus(201);
});

app.get('/messages', (req,res) => {
    res.send(messages);
});

app.post('/status', (req, res) => {
    res.send('Status');
});

app.listen(PORT, () => {
    console.log(chalk.yellow.bold('Server running on port ' + PORT));
}); 