import Sequelize from "sequelize";
import dotenv from 'dotenv'

dotenv.config()

let mysqlDb

if(process.env.NODE_ENV !== "PRODUCTION") {
    mysqlDb = new Sequelize ('db_old_ab', 'root', '', {
        host: "localhost",
        dialect: "mysql",
        timezone:"+08:00"
    })
}


export default mysqlDb