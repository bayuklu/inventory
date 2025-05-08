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
    
        await db.query("SET TIME ZONE 'Asia/Makassar';")
    
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



const allowedOrigins = [
    'http://localhost:5173',
    'https://abfrozen.vercel.app'
  ]
  
  const corsOptions = {
    credentials: true,
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  }
  
app.use(cors(corsOptions))

app.use(cookieParser())
app.use(express.json())
app.use(router)

app.listen(PORT, () => {console.log(`Server running at port ${PORT}`)})