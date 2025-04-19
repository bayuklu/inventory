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
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthrorized: false
        }
    },
    logging: false,
    dialectModule: pg
})

export default db