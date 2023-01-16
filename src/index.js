import express, {json} from 'express';
import cors from 'cors';
import {MongoClient} from 'mongodb';
import dotenv from 'dotenv';
//import joi from 'joi';
import chalk from 'chalk';
import dayjs from 'dayjs';

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
    const period = Date.now();
    const time = dayjs(period).format('HH:mm:ss');
    const participant = {
        name: name,
        lastStatus: period
    };
    const message = {
        from: name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: time
    };

    try{
        await db.collection('participants').insertOne({participant});
        await db.collection('messages').insertOne({message});
        res.sendStatus(201);
    } catch(error){
        res.status(422).send('Não foi possível cadastrar o participante');
    }
});

app.get('/participants', async (req, res) => {
    try{
        const participants = await db.collection('participants').find({}).toArray();
        res.send(participants);
    } catch(error){
        res.status(500).send('Não foi possível obter participantes');
    }
});

app.post('/messages', async (req, res) => {
    const {to, text, type} = req.body; 
    const {user} = req.headers;
    const time = dayjs(Date.now()).format('HH:mm:ss');
    
    const message = {
        from: user,
        to: to, 
        text: text, 
        type: type,
        time: time 
    };
    
    try{
        await db.collection('messages').insertOne(message);
        res.sendStatus(201);
    } catch(error){
        res.status(422).send('Não foi possível enviar a mensagem');
    }
});

app.get('/messages', async (req,res) => {
    const {limit} = req.query;
    
    try{
        const messages = await db.collection('messages').find({}).toArray();
        
        if(!limit) {
            const messageLimited = messages.reverse().splice(0, 100);
            res.send(messageLimited.reverse());
        } else {
            const messageLimited = messages.reverse().splice(0, limit);
            res.send(messageLimited.reverse());
        }
    } catch(error){
        res.status(500).send('Não foi possível obter as mensagens');
    }
});

app.post('/status', async (req, res) => {
    const {user} = req.headers;
    const participant = await db.collection('participants').findOne({name: user});
    
    if(!participant){
        res.sendStatus(404);
        return;
    } 
    await db.collection('participants').updateOne({name: user},{$set: {"lastStatus": Date.now()}});
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(chalk.yellow.bold('Server running on port ' + PORT));
}); 