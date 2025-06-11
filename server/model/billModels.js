import db from "../config/Database.js"
import { DataTypes } from "sequelize"

const Bills = db.define(
    'bills',
    {
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        setor1: {
            type: DataTypes.INTEGER
        },
        setor2: {
            type: DataTypes.INTEGER
        },
        setor3: {
            type: DataTypes.INTEGER
        },
        setor4: {
            type: DataTypes.INTEGER
        },
    }
)

export default Bills