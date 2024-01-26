// VERSION SOCKET

import http from 'http'
import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'

import cors from 'cors'

import { config } from 'dotenv'
config();

import { Server } from 'socket.io'

const app = express()
const httpServer = http.createServer(app)

const corsOptions = {
    origin: '*',
};

const io = new Server(httpServer);

let USERS = {}
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    USERS[socket.id] = socket
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        delete USERS[socket.id]
    });
});

app.use(bodyParser.json({ limit: '2gb', extended: true }))
app.use(morgan('dev'))
app.use(cors(corsOptions))
app.use(express.json())

app.get('/', (req, res) => {
    res.send({ message: 'Welcome to the RASPBERRY' });
});

httpServer.listen(process.env.PORT, () => {
    console.log('Server up and running');
});


// VERSION ESTANDAR

// import http from 'http'
// import express from 'express'
// import morgan from 'morgan'
// import bodyParser from 'body-parser'

// import cors from 'cors'

// import { config } from 'dotenv'
// config()

// const app = express()

// const corsOptions = {
//     origin: '*'
// }

// app.use(bodyParser.json({limit: '2gb', extended: true}))
// app.use(morgan('dev'))
// app.use(cors(corsOptions))
// app.use(express.json())

// app.get('/', (req, res) => {
//     res.send({message : 'Welcome to the RASPBERRY'})
// })

// const httpServer = http.createServer(app)

// httpServer.listen(process.env.PORT, () => {
//     console.log('Server up running')
// })
