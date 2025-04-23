import Sequelize from "sequelize";
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

// const db = new Sequelize ('inventory2', 'root', '', {
//     host: "localhost",
//     dialect: "mysql",
//     // dialectOptions:{useUTC:false},
//     timezone:"+08:00"
// })

const db = new Sequelize(process.env.PSQL, {
    dialect: "postgres",
    protocol: "postgres",
    timezone: "+08:00",
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthrorized: false
        }
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