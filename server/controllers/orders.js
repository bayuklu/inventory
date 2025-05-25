import Orders from '../model/ordersModel.js'
import OrderRecordModel from '../model/orderRecordModel.js'
import Items from '../model/ItemsModel.js'
import {Op, where} from 'sequelize'
import orderRecords from '../model/orderRecordModel.js'
import { TODAY_START_WITA_CONVERT_UTC, TOMORROW_START_WITA_CONVERT_UTC, YESTERDAY_START_WITA_CONVERT_UTC } from '../utils/time.js'

export const getTurnCode = async(req, res) => {
    const date = new Date()

    try {
        const turnCode = `${date.getDate()}${date.getMonth() + 1}${date.getFullYear()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`
        res.status(200).json({turn_code: turnCode})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getRecordsByTurnCode = async(req, res) => {
    const turnCode = req.params['turnCode']

    try {
        const records = await OrderRecordModel.findAll({
            attributes: ['id', 'itemCode', 'itemName', 'price', 'quantity', 'discount', 'finalPrice', 'isUnitChecked', 'profit', 'capitalPrice'],
            where: {
                turnCode: turnCode
            }
        })
        // console.log(records)
        res.status(200).json({data: [...records]})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})  
    }
}

export const changePriceForSelectedItem = async(req, res) => {
    const {itemId, newPrice, turnCode, itemCode} = req.body;
    // itemId = record id
    if (!itemId || !newPrice) return res.status(400).json({ msg: "Item ID and new price are required" });
    try {
        const itemRecord = await orderRecords.findOne({
            where: { id: itemId }
        });
        if (!itemRecord) return res.status(403).json({ msg: "Item not found!" });
        
        const item = await Items.findOne({
            where: { code: itemCode },
            raw: true
        });
        const { capitalPrice } = item;
        if(newPrice < capitalPrice) {
            return res.status(400).json({msg: "Harga jual tidak boleh kurang dari harga modal"})
        }

        // Update harga item
        itemRecord.price = newPrice;

        if (itemRecord.discount > 0) {
            // Hitung jumlah diskon
            const discountAmount = newPrice * itemRecord.discount;
            // Harga setelah diskon
            const finalPricePerUnit = newPrice - discountAmount;
            // Hitung harga akhir berdasarkan kuantitas
            itemRecord.finalPrice = finalPricePerUnit * itemRecord.quantity;

            // Hitung profit setelah diskon
            itemRecord.profit = (finalPricePerUnit * itemRecord.quantity) - (capitalPrice * itemRecord.quantity);
        } else {
            // Jika tidak ada diskon, hitung harga akhir dan profit secara normal
            itemRecord.finalPrice = itemRecord.quantity * newPrice;
            itemRecord.profit = (newPrice * itemRecord.quantity) - (capitalPrice * itemRecord.quantity);
        }

        // Simpan perubahan ke database
        await itemRecord.save();

        res.status(200).json({ msg: "Price Record Updated Successfully!" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Internal server error" });
    }
};


export const createRecordOrder = async(req, res) => {
    const {turnCode, itemCode, quantity, isUnitChecked} = req.body

    if (isUnitChecked.split("-")[0] == 2 && quantity == 0) {
        return res.status(400).json({msg: "Barang ini belum memiliki data per pack!"})
    }else if(!turnCode || !itemCode || !quantity || !isUnitChecked){
        return res.status(400).json({msg: "All field are required!"})
    }

    try {
        const item = await Items.findOne({
            where: {
                code: itemCode.toUpperCase()
            }
        })
        if(!item) {
            return res.status(400).json({msg: "Item not found"}) 
        }else if(item.dataValues.stock == 0){
            return res.status(400).json({msg: "Out of stock"}) 
        }else if(item.dataValues.stock < quantity) {
            return res.status(400).json({msg: "Stock not enought"})
        } 

        const checkItemIsRecorded = await orderRecords.findOne({
            where: {
                [Op.and] : {
                    turnCode: turnCode,
                    itemCode: itemCode
                }
            }
        })
        if(checkItemIsRecorded) {
            const newQuantity = checkItemIsRecorded.quantity += Number(quantity)
            if(checkItemIsRecorded.discount > 0){
                const discountAmmount = checkItemIsRecorded.price * checkItemIsRecorded.discount
                checkItemIsRecorded.finalPrice = (checkItemIsRecorded.price - discountAmmount) * newQuantity
            }else{
                checkItemIsRecorded.finalPrice = checkItemIsRecorded.price * newQuantity
            }
            await checkItemIsRecorded.save()
            return res.status(208).json({msg: "Order record already created!"})
        }

        const itemName = item.dataValues.name
        const price = item.dataValues.price
        const discount = item.dataValues.discount
        const finalPrice = (price - (discount * price)) * quantity
        const realProfit = (item.dataValues.price * quantity) - (item.dataValues.capitalPrice * quantity)
        const capitalPrice = item.dataValues.capitalPrice
        
        await OrderRecordModel.create({
            turnCode: turnCode.toUpperCase(),
            itemName: itemName,
            itemCode: itemCode,
            price: price,
            quantity: quantity,
            isUnitChecked: isUnitChecked,
            discount: discount,
            finalPrice: finalPrice,
            profit: realProfit,
            capitalPrice: capitalPrice
        })

        res.status(201).json({msg: "Order record created"})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const deleteRecordOrder = async(req, res) => {
    const recordId = req.params['recordId']
    if(!recordId) return res.status(400).json({msg: "Record id is reuired!"})

    try {
        const item = await orderRecords.findOne({
            where: {
                id: recordId
            }
        })
        if(!item) return res.status(403).json({msg: "Order record not found"})
        
        await item.destroy()
        res.status(200).json({msg: "Record successfully deleted"})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const changeQuantityRecord = async(req, res) => {
    const payloads = (({ isLeft, id, turnCode}) => {
        return { isLeft, id, turnCode}
      })(req.body)      

    for(const body in payloads) {
        if(payloads[body] === "") {
            return res.status(400).json({msg: `Nilai '${body}' dibutuhkan!`})
            break
        }else if(payloads[body] == undefined) {
            return res.status(400).json({msg: `Parameter '${body}' belum dikirim!`})
            break
        }
    }

    try {
        const orderRecord = await orderRecords.findOne({
            where: {
                [Op.and]: [
                    {id: payloads.id},
                    {turnCode: payloads.turnCode}
                ]
            },
            attributes: ['id', 'itemCode', 'itemName', 'price', 'quantity', 'discount', 'finalPrice', 'isUnitChecked', 'profit', 'capitalPrice'],
        })
        if(!orderRecord){
            return res.status(404).json({msg: "Record not found!"})
        }

        // console.log(orderRecord.dataValues)
        
        const oldIsUnitChecked = orderRecord.dataValues.isUnitChecked.split("-")

        if
        (
            ((Number(oldIsUnitChecked[1]) - Number(oldIsUnitChecked[2]) === 0 && payloads.isLeft))
            ||
            ((orderRecord.dataValues.quantity - 1 === 0 && payloads.isLeft))
        )
        {
            return res.status(400).json({msg: "TIdak dapat mengunrangi lagi!"})
        }

        function convertUnit(oldIsUnCk, isLeft) {
            const type = oldIsUnCk[0]
            const qty = Number(oldIsUnCk[1])
            const valOfUnit = Number(oldIsUnCk[2])

            if (type === "0") {
                return "0"
            }else if (type === "1") { 
                return `1-${isLeft ? qty - valOfUnit : qty + valOfUnit}-${valOfUnit}`
            }else if (type === "2") {
                return `2-${isLeft ? qty - valOfUnit : qty + valOfUnit}-${valOfUnit}`
            }
        }

        const newIsUnitChekced = convertUnit(oldIsUnitChecked, payloads.isLeft)
        const cPriceBef = orderRecord.dataValues.capitalPrice
        const priceBef = orderRecord.dataValues.price
        const quantityBef = orderRecord.dataValues.quantity
        const finPriceBef = orderRecord.dataValues.finalPrice
        const profitBef = orderRecord.dataValues.profit

        let newQuantity, newFinalPrice, newProfit

        if(newIsUnitChekced === "0") {
            if(payloads.isLeft) {
                newQuantity = quantityBef - 1
                newFinalPrice = finPriceBef - priceBef
                newProfit = profitBef - (priceBef - cPriceBef)
            }else {
                newQuantity =  quantityBef + 1
                newFinalPrice = finPriceBef + priceBef
                newProfit = profitBef + (priceBef - cPriceBef)
            }
        }else {
            newQuantity = Number(newIsUnitChekced.split("-")[1])

            if(payloads.isLeft) {
                newFinalPrice = finPriceBef - (Number(oldIsUnitChecked[2]) * priceBef)
                newProfit = profitBef - ((priceBef - cPriceBef) * newQuantity)
                newProfit = profitBef - (Number(oldIsUnitChecked[2]) * (priceBef - cPriceBef))
            }else {
                newFinalPrice = finPriceBef + (Number(oldIsUnitChecked[2]) * priceBef)
                newProfit = profitBef + (Number(oldIsUnitChecked[2]) * (priceBef - cPriceBef))
            }
        }

        await orderRecord.update({
            isUnitChecked: newIsUnitChekced || orderRecord.dataValues.isUnitChecked,
            quantity: newQuantity || orderRecord.dataValues.quantity,
            finalPrice: newFinalPrice || orderRecord.dataValues.finalPrice,
            profit: newProfit || orderRecord.dataValues.profit
          });

        res.status(201).json({msg: "Update in Cashier Qty Successfully", data: orderRecord.dataValues})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const createFinalOrder = async(req, res) => {
    const {turnCode, cash, profit, outlet, sales, isBon, author} = req.body
    // console.log(isBon)
    if(!cash || !outlet || !sales || !author) return res.status(400).json({msg: "Cash, Outlet, Sales or Aurhor required"})
    
try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();

    const checkDuplicateOrders = await Orders.findOne({
    where: {
        turnCode,
        createdAt: {
        [Op.between]: [start, end],
        },
    },
    });
    if(checkDuplicateOrders) return res.status(402).json({msg: "Duplicate Orders Detected"})

    const recordsOrdered = await OrderRecordModel.findAll({
        where: {
            turnCode: turnCode
        }
    })
    if(recordsOrdered.length <= 0) return res.status(400).json({msg: "No item added yet"})

    //membuat gabungan item dan membuat total diskon (start)
    let items = []
    let discountItems = []

    recordsOrdered.forEach(element => {
        items.push(`${element.dataValues.itemCode}:${element.dataValues.quantity}`)
        discountItems.push(element.dataValues.itemCode)
    })
    
    const encItems = items.join(",")
    discountItems.join(',')

    const findPriceAndDiscount = await Items.findAll({
        attributes: ['price', 'discount', 'unitTotal'],
        where: {
            code: {
                [Op.or]: [discountItems]
            }
        }
    })
    const unitTotal = findPriceAndDiscount[0].dataValues.unitTotal

    let totalDiscount = []

    findPriceAndDiscount.forEach(element => {
        totalDiscount.push(element.dataValues.discount * element.dataValues.price)
    })
    
    const sumDiscount = totalDiscount.reduce((acc, val) => {
        return acc + val
    })
    //membuat gabungan item dan membuat total diskon (end)

    //membuat pembayaran beserta kembalian (start)
    const getPayment = await OrderRecordModel.findAll({
        attributes: ['finalPrice'],
        where: {
            turnCode: turnCode
        }
    })

    let allPayments = []
    getPayment.forEach(element => {
        allPayments.push(element.dataValues.finalPrice)
    })

    const totalPayment = allPayments.reduce((acc, val) => {
        return acc + val
    })

    if(cash < totalPayment) return res.status(400).json({msg: "Not enought cash"})
    const cashReturn = cash - totalPayment
    //membuat pembayaran beserta kembalian (end)

    //membuat transaksi kode (start)
    const date = new Date()
    const transCode = `${Math.floor(Math.random() * 9000) + 1000}${date.getDate()}${date.getMonth()}${date.getFullYear()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`
    //membuat transaksi kode (end)

    //mengupdate stock barang yang di order (start)
    let ordersByRecord = []
    recordsOrdered.forEach(element => {
        ordersByRecord.push(`${element.itemCode},${element.quantity}`)
    })

    for (const element of ordersByRecord) {
        const turnExe = element.split(',');      
        try {
          const item = await Items.findOne({
            where: {
              code: turnExe[0]
            }
          });
          if(item.stock < turnExe[1]) return res.status(400).json({msg: `Stock for ${turnExe[0]} code is not enought`})

          item.stock -= turnExe[1]

          await item.save()
        } catch (error) {
          console.error(error);
        }
    }
    //mengupdate stock barang yang di order (end)

    const isPrinted = author === "admin" ? false : true
    //membuat orderan (start)
    await Orders.create({
        transCode: transCode,
        items: encItems,
        totalDiscount: sumDiscount,
        totalPayment: totalPayment,
        cash: cash,
        profit: profit,
        return: cashReturn,
        outlet: outlet,
        sales: sales,
        turnCode: turnCode,
        isBon: isBon,
        author: author,
        isPrinted: isPrinted
    })
    //membuat orderan (end)

    res.status(200).json({
        msg: "Order successfully created",
        data: {cashReturn, sumDiscount, transCode},
        recipt: [...recordsOrdered],
        unitTotal: unitTotal
    })
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getRequestPrintFromAdmin = async (req, res) => {
    try {
        const requests = await Orders.findAll({
            where: {
                [Op.and]: [
                    {author: "admin"},
                    {isPrinted: false},
                    {
                        createdAt: {
                            [Op.lt]: TOMORROW_START_WITA_CONVERT_UTC,
                            [Op.gt]: TODAY_START_WITA_CONVERT_UTC
                        }
                    }
                ]
            },
            raw: true
        })
        if(requests.length < 1) return res.status(404).json({msg: "Tidak ada request dari admin"})

        res.status(200).json(requests)
        
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getRecordOrdersFromAdminRequest = async(req, res) => {
    const turnCode = req.params['turnCode']
    if(!turnCode) return res.sendStatus(400)

    try {
        const recordsOrdered = await OrderRecordModel.findAll({
            where: {
                turnCode: turnCode
            }
        })
        if(recordsOrdered.length < 1) return res.status(404).json({msg: "tidak ada order record untuk turn code ini!"})

        res.status(200).json([...recordsOrdered])
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const setOrderIsPrinted = async(req, res) => {
    const turnCode = req.params['turnCode']

    try {
        const order = await Orders.findOne({
            where: {
                [Op.and]: {
                    turnCode: turnCode,
                    author: "admin"
                }
            }
        })
        if(!order) return res.status(404).json({msg: "order not found!"})

        await order.update({
            isPrinted: true
        })

        res.status(200).json({msg: "Success"})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}