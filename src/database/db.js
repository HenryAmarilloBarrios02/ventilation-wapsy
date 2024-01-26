import { Pool } from 'pg'
import { Sequelize } from 'sequelize'
import { config } from 'dotenv'
config()

const db = new Sequelize(process.env.POSTGRES_DATABASE, process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
    host: process.env.POSTGRES_HOST,
    dialect: process.env.POSTGRES_DIALECT,
    port: process.env.POSTGRES_PORT,
    logging: false
})

db.authenticate()
.then(() => {
    console.log('Connected to DB');
})
.catch((error) => {
    console.error('Error connecting to the database:', error);
});

export default db;