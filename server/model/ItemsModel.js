import {DataTypes} from "sequelize";
import db from '../config/Database.js'

const Items = db.define(
    'items',
    {
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        unitTotal: {
            type: DataTypes.INTEGER,
            allowNull: false
        },        
        unitTotalPack: {
            type: DataTypes.INTEGER,
            allowNull: false
        },        
        discount: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        capitalPrice: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }
)

export default Items