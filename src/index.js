import express, {json} from 'express';
import cors from 'cors';
import {MongoClient} from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi';

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
        console.log("Conectou"); 
    })
    .catch(() => 
        console.log("Não conectou")
    )

const users = [];

app.post('/participants', (req,res) => {
    const {name} = req.body;
    
    users.push(name);
    res.sendStatus(201);
});

app.get('/participants', (req, res) => {
    res.send(users);
});

app.post('/messages', (req, res) => {
    const {to, text, type} = req.body;
    const message = {
        to: 'Todos', 
        text: 'oi galera', 
        type: 'message', 
    };
    message.push(message);
    res.sendStatus(201);
});

app.get('/messages', (req,res) => {
    res.send(messages);
});

app.post('/status', (req, res) => {
    res.send('Status');
});

app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
}); 