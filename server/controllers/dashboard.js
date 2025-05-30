import Orders from '../model/ordersModel.js'
import OrderRecordModel from '../model/orderRecordModel.js'
import Items from '../model/ItemsModel.js'
import {Op, where} from 'sequelize'
import Outlet from '../model/outletModels.js'
import { convertToWita, SEVEN_DAYS_AGO_WITA_CONVERT_UTC, SIX_DAYS_AGO_WITA_CONVERT_UTC, TODAY_START_WITA_CONVERT_UTC, YESTERDAY_START_WITA_CONVERT_UTC } from '../utils/time.js'
import dayjs from 'dayjs'

export const getTotalOfItemsStock = async(req, res) => {
    try {
        const allStock = await Items.findAll({
            attributes: ['stock']
        })
        let stocks = 0
        allStock.forEach(element => {
            stocks += element.dataValues.stock
        });
        // const totalStock = stocks.reduce((acc, val) => {return acc + val})
        res.status(200).json({total_stock: stocks})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getTotalOFItemsProduct = async(req, res) => {
    try {
        const allStock = await Items.count()
        res.status(200).json({total_product: allStock})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getTodayOrders = async(req, res) => {
    const NOW = new Date()
    try {
        const todayOrders = await Orders.count({
            where: {
                createdAt: {
                    [Op.gt]: TODAY_START_WITA_CONVERT_UTC
                }
            }
        })
        res.status(200).json({total_today_orders: todayOrders})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})        
    }
}

export const getTodayIncomes = async(req, res) => {
    const NOW = new Date()
    try {
        const todayIncomes = await Orders.findAll({
            attributes: ['totalPayment'],
            where: {
                createdAt: {
                    [Op.gt]: TODAY_START_WITA_CONVERT_UTC
                }
            }
        })
        let incomes = 0
        if(todayIncomes.length == 0) return res.status(200).json({total_today_income: '0'})

        todayIncomes.forEach(e => {incomes += e.dataValues.totalPayment})
        res.status(200).json({total_today_income: incomes})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})        
    }
}

export const getTodayProfit = async(req, res) => {
    const NOW = new Date()
    try {
        const todayProfit = await Orders.findAll({
            attributes: ['profit'],
            where: {
                createdAt: {
                    [Op.gt]: TODAY_START_WITA_CONVERT_UTC
                }
            }
        })
        let profit = 0
        if(todayProfit.length == 0) return res.status(200).json({profit: '0'})

        todayProfit.forEach(e => {profit += e.dataValues.profit})
        res.status(200).json({profit: profit})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})        
    }
}

export const getBestSeller = async(req, res) => {
    try {
        const NOW = new Date()
        const SEVEN_DAYS_AGO_WITA_CONVERT_UTC = new Date(new Date(NOW.setDate(NOW.getDate() - 7)).setHours(0,0,0,0))

        const bestSellers = await Orders.findAll({
            where: {
                createdAt: {
                    [Op.gt] : SEVEN_DAYS_AGO_WITA_CONVERT_UTC
                }
            },
            attributes: ['items']
        })
        if(bestSellers.length <= 0) return res.status(200).json({item: "No order last week"})
        let items = [], bestSeller = []
        bestSellers.forEach(element => {
            bestSeller.push(element.dataValues.items.split(','))
        });
        bestSeller.forEach(el => {el.forEach(e => {
            items.push(e)}
            )})

        let itemOrder = []
        items.forEach(item => {
            itemOrder.push(item.split(':')[0]);
        })
        // Menggunakan objek untuk menghitung frekuensi
        const frequency = {};
        itemOrder.forEach(item => {
        frequency[item] = (frequency[item] || 0) + 1;
        });

        // Mendapatkan item yang paling sering muncul
        const mostFrequentItem = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);

        const itemMostOrderAllTime = await Items.findOne({
            where: {
                code: mostFrequentItem
            }
        })
        return res.status(200).json({item: itemMostOrderAllTime.name})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getTodayBestSeller = async(req, res) => {
    try {
        const NOW = new Date()

        const bestSellers = await Orders.findAll({
            where: {
                createdAt: {
                    [Op.gt] : TODAY_START_WITA_CONVERT_UTC
                }
            },
            attributes: ["items"]
        })
        if(bestSellers.length <= 0) return res.status(200).json({item: "No order today"})
        let items = [], bestSeller = []
        bestSellers.forEach(element => {
            bestSeller.push(element.dataValues.items.split(','))
        });
        bestSeller.forEach(el => {el.forEach(e => {
            items.push(e)}
            )})

        let itemOrder = []
        items.forEach(item => {
            itemOrder.push(item.split(':')[0]);
        })
        // Menggunakan objek untuk menghitung frekuensi
        const frequency = {};
        itemOrder.forEach(item => {
        frequency[item] = (frequency[item] || 0) + 1;
        });

        // Mendapatkan item yang paling sering muncul
        const mostFrequentItem = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
        
        const itemMostOrderToday = await Items.findOne({
            where: {
                code: mostFrequentItem
            }
        })
        return res.status(200).json({item: itemMostOrderToday.name})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getLast7DaysIncomes = async(req, res) => {
    try {
        // Create an array to hold income data for the last 7 days excluding today
        let incomes = new Array(7).fill(0);
    
        // Fetch all orders from the last 7 days excluding today
        const orders = await Orders.findAll({
            attributes: ['totalPayment', 'createdAt'],
            where: {
            createdAt: {
                [Op.gt]: SEVEN_DAYS_AGO_WITA_CONVERT_UTC,
                [Op.lt]: TODAY_START_WITA_CONVERT_UTC
            }
            },
            raw: true
        });
    
        // Iterate over each order and add the income to the corresponding day
        orders.forEach(order => {
            const orderDate = dayjs(order.createdAt)
            const dayIndex = Math.floor((TODAY_START_WITA_CONVERT_UTC - orderDate) / (1000 * 60 * 60 * 24));
            incomes[6 - dayIndex] += order.totalPayment;
        });
    
        res.status(200).json({ incomes });
        } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Internal server error" });
    }
}

export const getTagihanIn7DayMore = async(req, res) => {
    const isMore = req.params['isMore']
    const latestDateShowed = req.params['latestDateShowed']
    const limit = 5
    // console.log(latestDateShowed)
    // console.log(SIX_DAYS_AGO_WITA_CONVERT_UTC)

    try {
        const httpResponse = isMore === "1" ? 201 : 200
        // console.log(isMore)

        const transaction = await Orders.findAll({
            where: {
                [Op.and]: {
                    isBon: true,
                    createdAt: {
                        [Op.lt]: isMore === "1" ? latestDateShowed : SIX_DAYS_AGO_WITA_CONVERT_UTC
                    },
                }
            },
            raw: true,
            order: [
                ['createdAt', 'DESC'] 
            ],
            limit: limit,
            attributes: ['totalPayment', 'createdAt', 'outlet', 'id']
        })

        const manyOfTransaction = await Orders. findAll({
            where: {
                [Op.and]: {
                    isBon: true,
                    createdAt: {
                        [Op.lt]: SIX_DAYS_AGO_WITA_CONVERT_UTC
                    },
                }
            },
            attributes: ['id'],
            raw: true
        })
        
        // console.log(manyOfTransaction)
        const isEnd = transaction.length < limit ? "1" : "0"

        res.status(httpResponse ?? 200).json({
            transaction: transaction,
            manyOfTransaction: manyOfTransaction.length,
            isEnd: isEnd
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Internal server error" });
    }
}

export const lunaskanTagihan = async(req, res) => {
    const {orderId} = req.body
    // console.log(orderId)
    if(!orderId) return res.status(400).json({msg: "order id required!"})

    try {
        const order = await Orders.findOne({
            where: {id: orderId}
        })
        if(!order) return res.status(404).json({msg: "order not found!"})

        await order.update({
            isBon: false
        })

        res.status(200).json({msg: `Tagihan berhasil dilunaskan`})
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: "Internal server error" });
    }
}

export const getOutletName = async(req, res) => {
    const outletId = req.params['outletId']
    try {
        const outlet = await Outlet.findOne({ 
            where: {
                id: outletId
            },
            raw: true,
            attributes: ['name', 'address']
         })

         res.status(200).json(outlet)
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Internal server error" });
    }
}

//==============================================================================================================





// FUNGSI HALAMAN DASHBOARD DIBAWAH





//==============================================================================================================

export const getTodayOrdersData = async (req, res) => {
    const dateParam = req.params['date']; 
    const parsedDate = dayjs(dateParam);
    // console.log(parsedDate)
  
    if (!parsedDate.isValid()) {
      return res.status(400).json({ msg: "Tanggal tidak valid" });
    }
  
    const todayStart = parsedDate.tz("Asia/Makassar").startOf('day').toDate();
    const tomorrowStart = dayjs(todayStart).add(1, 'day').toDate();
  
    try {
      const orders = await Orders.findAll({
        order: [['createdAt', 'DESC']],
        where: {
          createdAt: {
            [Op.gte]: todayStart,
            [Op.lt]: tomorrowStart
          }
        },
        attributes: ["items", "outlet", "sales", "profit", "totalPayment", "id", "createdAt"]
      });
  
      if (orders.length < 1) {
        return res.status(404).json({ msg: "Tidak ada data pada tanggal tersebut!", date: todayStart });
      }
  
      res.status(200).json({ orders, date: todayStart });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error", error });
    }
  };

export const getItemListForTodayOrders = async(req, res) => {
    const code = req.params['code']
    // console.log(code)
    // console.log("OOOOOOOOOOOOOOo")
    if(!code) return res.sendStatus(400)
    try {
        const product = await Items.findOne({ where: { code }, raw: true, attributes: ['name'] })
        // console.log(code)
        // console.log(product)
        if(!product) return res.status(404).json({msg: `ItemList of ${code} not found!`})

        res.status(200).json(product)
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: "Internal server error", error })
    }
}

export const getOutletForTodayOrders = async(req, res) => {
    const id = req.params['id']
    if(!id) return res.sendStatus(400)
    try {
        const otl = await Outlet.findOne({ where: { id }, raw: true, attributes: ['name'] })
        if(!otl) return res.status(404).json({msg: `Outlet Id of ${id} not found!`})

        // console.log(otl)
        res.status(200).json(otl)
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: "Internal server error", error })
    }
}

export const deleteTransaction = async(req, res) => {
    const transactionId = req.params['transactionId']
    if(!transactionId) return res.status(400).json({msg: "Id transaction required!"})

    try {
        const transaction = await Orders.findOne({
            where: {id: transactionId},
            attributes: ["id"]
        })
        if(!transaction) return res.status(404).json({msg: "Transaksi not found!"})

        await transaction.destroy()

        res.status(200).json({
            msg: `Order deleted successfully!`
        })
    } catch (error) {
        res.status(500).json({msg: "internal server error", error})
    }
}

export const changeSalesName = async(req, res) => {
    const {transactionId, salesName} = req.body
    if(!transactionId || !salesName) return res.status(400).json({msg: "All field required!"})
    // console.log(salesName)
    try {
        const transaction = await Orders.findOne({where: {id: transactionId}, attributes: ["id"]})
        if(!transaction) return res.status(404).json({msg: "Transaction order not found!"})

        await transaction.update({
            sales: salesName || transaction.sales
        })


        res.status(200).json({msg: "Sales transaction changed successfully"})
    } catch (error) {
        res.status(500).json({msg: "internal server error", error})
    }
}