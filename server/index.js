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
import { tableMigrator, valueChangerPlus } from './utils/db.js'

const app = express()

dotenv.config()
const PORT = process.env.PORT

const init = async() => {
    try {
        await db.authenticate()
        console.log("Database connected")    

        // return

        //Singkron Database
        await db.sync({
            alter: true
        })

        
        //Maintenance Database
        // console.log("[DB FUNCTION] Maintenance Table...")
        //1.
        // await tableMigrator({tableName: "items"})

        //2.
        // await valueChangerPlus(
        //   {
        //     tableName: "items",
        //     uniqKey: "code",
        //     columnTargets: ['unitTotal', 'unitTotalPack']
        //   }
        // )

        // console.log("[DB FUNCTION] Maintenance Tabel Berhasil!")
    } catch (error) {
        console.log(error)
    }
}

await init()


const allowedOrigins = [process.env.FRONTEND_ORIGIN]
  
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
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