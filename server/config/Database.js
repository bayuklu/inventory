import Sequelize from "sequelize";
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const db = new Sequelize(
    // process.env.PRODUCTION_PSQL,
    process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, 
    {
    dialect: "postgres",
    protocol: "postgres",
    timezone: "UTC",
    dialectOptions: {
        // ======= gunakan ini jika di dalam lingkungan production ========
        // ssl: {
        //     require: true,
        //     rejectUnauthorized: false
        // },
        // ======= gunakan ini jika di dalam lingkungan production ========
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



export default db