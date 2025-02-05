import Sequelize from "sequelize";

const db = new Sequelize ('inventory2', 'root', '', {
    host: "localhost",
    dialect: "mysql",
    // dialectOptions:{useUTC:false},
    timezone:"+08:00"
})

export default db