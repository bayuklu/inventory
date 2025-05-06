import express from 'express'
import db from './config/Database.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './router/index.js'
import dotenv from 'dotenv'
import orderRecords from './model/orderRecordModel.js'
import Items from './model/ItemsModel.js'
import Orders from './model/ordersModel.js'
import Outlet from './model/outletModels.js'
import Users from './model/userModel.js'

// import mysqlDb from './config/MysqlDb.js'

const app = express()

dotenv.config()
const PORT = process.env.PORT

const init = async() => {
    try {
        await db.authenticate()
        console.log("Database connected")
    
        await db.query("SELECT now() AT TIME ZONE 'Asia/Makassar';")
    
        // await Orders.sync({
        //     alter: true
        // })
    
        // console.log("Migrasi...")
        // const [rows] = await mysqlDb.query('SELECT * FROM outlets');
    
        // for (const row of rows) {
        //   await db.query(
        //     'INSERT INTO outlets("id", "name", "address", "phone", "createdAt", "updatedAt") VALUES($1, $2, $3, $4, $5, $6)',
        //     {
        //       bind: [row.id, row.name, row.address, row.phone, row.createdAt, row.updatedAt]
        //     }
        //   );
        // }    
    } catch (error) {
        console.log(error)
    }
}

init()

app.use(cors({credentials: true, 
    origin: "http://localhost:5173",
    // origin: "https://abfrozen.vercel.app"
}))

app.use(cookieParser())
app.use(express.json())
app.use(router)

app.listen(PORT, () => {console.log(`Server running at port ${PORT}`)})