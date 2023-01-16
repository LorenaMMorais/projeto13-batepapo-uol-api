import express, {json} from 'express';
import cors from 'cors';
import {MongoClient} from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi';
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
        db = mongoClient.db();
        console.log(chalk.green.bold('Banco conectado')); 
    })
    .catch(() => 
        console.log(chalk.red.bold('Banco não conectou'))
    )

setInterval(async () => {
    const participants = await db.collection('participants').find({}).toArray();
    const period = Date.now();
    const validate = participants.find(participant => {
        if(period - participant.lastStatus > 10000) return participant;
    });

    if(validate !== undefined){
        const message = {
            from: validate.name,
            to: 'Todos',
            text: 'sai da sala ...',
            type: 'status',
            time: dayjs(period).format('hh:mm:ss')
        };
        await db.collection('participants').deleteOne(validate);
        await db.collection('messages').insertOne(message);
    }
}, 15000);

app.post('/participants', async (req,res) => {
    const {name} = req.body;
    const period = Date.now();
    const time = dayjs(period).format('hh:mm:ss');

    const userSchema = joi.object({
        name: joi.string().required()
    });

    const validation = userSchema.validate({name});
    
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

    const participants = await db.collection('participants').find({}).toArray();
    const isParticipant = participants.some(participant => participant.name === name);

    if(validation.error) return res.status(422).send(validation.error.details[0].message);

    if(isParticipant) return res.status(409).send('Participante já existe');
    
    try{
        await db.collection('participants').insertOne(participant);
        await db.collection('messages').insertOne(message);
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
    const time = dayjs(Date.now()).format('hh:mm:ss');
    
    const messageSchema = joi.object({
        from: joi.string(),
        to: joi.string().required(), 
        text: joi.string().min(1).required(), 
        type: joi.string().valid('message', 'private_message'),
        time: joi.string() 
    });

    const message = {
        from: user,
        to: to, 
        text: text, 
        type: type,
        time: time 
    };
    
    const participant = await db.collection('participants').findOne({name: user});
    const validation = messageSchema.validate(message);

    if(validation.error) return res.status(422).send(validation.error.details[0].message);

    if(!participant) return res.status(422).send('Faça login novamente');

    try{
        await db.collection('messages').insertOne(message);
        res.sendStatus(201);
    } catch(error){
        res.status(422).send('Não foi possível enviar a mensagem');
    }
});

app.get('/messages', async (req,res) => {
    
    try{
        const {limit} = req.query;
        const from = req.headers.user;
        
        if(limit <= 0) return res.status(422).send('Limite de mensagens inválido');    

        //const messages = await db.collection('messages').find({$or:[{to: 'Todos'}, {to: user}, {from: user}]}).toArray();
        const messages = await db.collection("messages").find({
            $or: [
                { type: 'message' },
                { type: 'status' },
                { type: "private_message", from },
                { type: "private_message", to: from }
            ]
        }).toArray();


        if(!limit) {
            const messageLimited = messages.reverse().splice(0, 100);
            res.send(messageLimited.reverse());
        } else{
            const messageLimited = messages.reverse().splice(0, limit);
            res.send(messageLimited.reverse());
        }
    } catch(error){
        res.status(500).send('Não foi possível obter as mensagens');
    }
});

app.post('/status', async (req, res) => {
    const user = req.headers.user;
    const participant = await db.collection('participants').findOne({name: user});
    
    if(!participant) return res.sendStatus(404);

    await db.collection('participants').updateOne({name: user},{$set: {"lastStatus": Date.now()}});
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(chalk.yellow.bold('Server running on port ' + PORT));
}); 