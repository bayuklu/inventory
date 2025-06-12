import db from "../config/Database.js";
import { DataTypes } from "sequelize";

const Bills = db.define("bills", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  setor1: DataTypes.INTEGER,
  setor2: DataTypes.INTEGER,
  setor3: DataTypes.INTEGER,
  setor4: DataTypes.INTEGER,
});

export default Bills;
