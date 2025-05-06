import {DataTypes} from "sequelize";
import db from '../config/Database.js'

const Orders = db.define(
    'orders',
    {
        transCode: {
            type: DataTypes.STRING,
            allowNull: false
        },
        items: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        totalDiscount: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        totalPayment: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cash: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        return: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        profit: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        outlet: {
            type: DataTypes.STRING,
            allowNull: false
        },
        sales: {
            type: DataTypes.STRING,
            allowNull: false
        },
        turnCode: {
            type: DataTypes.STRING,
            allowNull: true
        },
    }
)

export default Orders