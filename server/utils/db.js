import mysqlDb from '../config/MysqlDb.js'
import db from '../config/Database.js';

//MODULE INI DIBUAT UNTUK MAINTENANCE / RESTORE DATABASE DI PRODUCTION

export const tableMigrator = async({tableName}) => {
    try{
        const [rows] = await mysqlDb.query(`SELECT * FROM ${tableName} LIMIT 5`);

        for (const row of rows) {
            const filteredRow = Object.entries(row).filter((rowEntrie) => rowEntrie[0] !== "id")

            const executorStrings = {
                rowFields: filteredRow.map(row => `"${row[0]}"`)
                            .join(","),
                rowValues: filteredRow.map(row => row[1]),
                rowIndexes: filteredRow.map((row, index) => `$${index + 1}`)
                            .join(",")
            }

            await db.query(
            `INSERT INTO ${tableName}(${executorStrings.rowFields}) VALUES(${executorStrings.rowIndexes})`,
            {
                bind: executorStrings.rowValues
            }
            );
        }       
    }catch(error)  {
        return console.error("\x1b[33m%s\x1b[0m", `Error Saat Maintenance Tabel... : => ${error}`)
    }
}


export const valueChangerPlus = async({tableName, uniqKey, columnTargets}) => {
    try{
        const [localDbRow] = await mysqlDb.query(`SELECT * FROM ${tableName}`);
        const [productionDbRow] = await db.query(`SELECT * FROM ${tableName}`);

        const keys = Object.keys(localDbRow[0])
        const indexes = {}

        Array.from
        (
            { length: columnTargets.length + 1 }, 
            ((_, idx) => 
                idx < 1 ? uniqKey : columnTargets[idx - 1] )
        )
        .forEach
        (
            (param) => 
                indexes[param] = keys.indexOf(param)
        )

        const sameRowInProduction = productionDbRow.filter((prodRow) => 
            localDbRow.find((localRow) => localRow.code === prodRow.code)
        )

        const notInProduction = localDbRow.filter(local => 
            !sameRowInProduction.find((same) => same.code === local.code )
        )  

        console.log(sameRowInProduction.length)
        console.log(notInProduction.length)

        localDbRow.forEach(async(row, index) => {
            
            const filteredLocalRow = Object.entries(row).filter((rowEntrie) => rowEntrie[0] !== "id")

            const executorStringsForUpdate = {
                rowFieldsUpdate: filteredLocalRow.map(row => `${row[0]}`),
                rowValuesUpdate: filteredLocalRow.map(row => row[1]),
            }

            await db.query
            (
                `
                    UPDATE 
                        ${tableName} 
                    SET 
                        "${executorStringsForUpdate.rowFieldsUpdate[indexes.unitTotal - 1]}" = '${executorStringsForUpdate.rowValuesUpdate[indexes.unitTotal - 1]}', 
                        "${executorStringsForUpdate.rowFieldsUpdate[indexes.unitTotalPack - 1]}" = '${executorStringsForUpdate.rowValuesUpdate[indexes.unitTotalPack - 1]} '
                    WHERE 
                        "${executorStringsForUpdate.rowFieldsUpdate[indexes.code - 1]}" = '${executorStringsForUpdate.rowValuesUpdate[indexes.code - 1]}'
                `
            )
            
            if(index < notInProduction.length) {
                const filteredNotInProdRow = Object.entries(notInProduction[index]).filter((rowEntrie) => rowEntrie[0] !== "id")
                    
                const executorStringsForInsert = {
                    rowFieldsInsert: filteredNotInProdRow.map(row => `"${row[0]}"`).join(", "),
                    rowValuesInsert: filteredNotInProdRow.map(row => row[1]),
                    rowIndexesInsert: filteredNotInProdRow.map((row, index) => `$${index + 1}`).join(",")
                }

                await db.query
                (
                    `
                        INSERT INTO 
                            ${tableName}(${executorStringsForInsert.rowFieldsInsert}) VALUES(${executorStringsForInsert.rowIndexesInsert})
                    `,
                    {
                        bind: executorStringsForInsert.rowValuesInsert // [..., ..., ...]
                    }
                )
            }
        })       
    }catch(error)  {
        return console.error("\x1b[33m%s\x1b[0m", `Error Saat Maintenance Tabel... : => ${error}`)
    }
}













