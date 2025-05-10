import Sequelize from "sequelize";
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

let db

if(process.env.NODE_ENV === "PRODUCTION")
{
    db = new Sequelize(
        process.env.PRODUCTION_PSQL,
        {
        dialect: "postgres",
        protocol: "postgres",
        timezone: "UTC",
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            },
            useUTC: true,
        },
        pool: {
            max: 5,
            min: 0,
            idle: 10000,
            acquire: 30000,
        },
        logging: false,
        dialectModule: pg
    })  
}else {
    db = new Sequelize(
        process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, 
        {
        dialect: "postgres",
        protocol: "postgres",
        timezone: "UTC",
        dialectOptions: {
            useUTC: true
        },
        pool: {
            max: 5,
            min: 0,
            idle: 10000,
            acquire: 30000,
        },
        logging: false,
        dialectModule: pg
    })
}




export default db