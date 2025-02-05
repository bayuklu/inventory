import Orders from '../model/ordersModel.js'
import OrderRecordModel from '../model/orderRecordModel.js'
import Items from '../model/ItemsModel.js'
import {Op} from 'sequelize'
import Outlet from '../model/outletModels.js'

export const getTotalOfItemsStock = async(req, res) => {
    try {
        const allStock = await Items.findAll({
            attributes: ['stock']
        })
        let stocks = []
        allStock.forEach(element => {
            stocks.push(element.dataValues.stock)
        });
        const totalStock = stocks.reduce((acc, val) => {return acc + val})
        res.status(200).json({total_stock: totalStock})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getTotalOFItemsProduct = async(req, res) => {
    try {
        const allStock = await Items.findAll({})
        res.status(200).json({total_product: allStock.length})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getTodayOrders = async(req, res) => {
    const TODAY_START = new Date().setHours(0,0,0,0)
    const NOW = new Date()
    try {
        const todayOrders = await Orders.findAll({
            where: {
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: NOW
                }
            }
        })
        res.status(200).json({total_today_orders: todayOrders.length})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})        
    }
}

export const getTodayIncomes = async(req, res) => {
    const TODAY_START = new Date().setHours(0,0,0,0)
    const NOW = new Date()
    try {
        const todayIncomes = await Orders.findAll({
            attributes: ['totalPayment'],
            where: {
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: NOW
                }
            }
        })
        let incomes = []
        if(todayIncomes.length == 0) return res.status(200).json({total_today_income: '0'})

        todayIncomes.forEach(e => {incomes.push(e.dataValues.totalPayment)})
        const totalIncome = incomes.reduce((acc, val) => {return acc + val})
        res.status(200).json({total_today_income: totalIncome})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})        
    }
}

export const getTodayProfit = async(req, res) => {
    const TODAY_START = new Date().setHours(0,0,0,0)
    const NOW = new Date()
    try {
        const todayProfit = await Orders.findAll({
            attributes: ['profit'],
            where: {
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: NOW
                }
            }
        })
        let profit = []
        if(todayProfit.length == 0) return res.status(200).json({profit: '0'})

        todayProfit.forEach(e => {profit.push(e.dataValues.profit)})
        const totalProfit = profit.reduce((acc, val) => {return acc + val})
        res.status(200).json({profit: totalProfit})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})        
    }
}

export const getBestSeller = async(req, res) => {
    try {
        const NOW = new Date()
        const SEVEN_DAYS_AGO = new Date(new Date(NOW.setDate(NOW.getDate() - 7)).setHours(0,0,0,0))

        const bestSellers = await Orders.findAll({
            where: {
                createdAt: {
                    [Op.gt] : SEVEN_DAYS_AGO
                }
            }
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
        const TODAY_START = new Date(NOW.setHours(0,0,0,0))

        const bestSellers = await Orders.findAll({
            where: {
                createdAt: {
                    [Op.gt] : TODAY_START
                }
            }
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
        // Create an array to hold income data for the last 6 days excluding today
        let incomes = new Array(6).fill(0);
        const NOW = new Date();
    
        // Get the date range for the last 6 days excluding today
        const SIX_DAYS_AGO = new Date(new Date().setDate(NOW.getDate() - 7)).setHours(0,0,0,0);
        const TODAY_START = new Date(NOW.setHours(0, 0, 0, 0));
    
        // Fetch all orders from the last 6 days excluding today
        const orders = await Orders.findAll({
            attributes: ['totalPayment', 'createdAt'],
            where: {
            createdAt: {
                [Op.gt]: SIX_DAYS_AGO,
                [Op.lt]: TODAY_START
            }
            }
        });
    
        // Iterate over each order and add the income to the corresponding day
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt)
            const dayIndex = Math.floor((TODAY_START - orderDate) / (1000 * 60 * 60 * 24));
            incomes[5 - dayIndex] += order.totalPayment;
        });
    
        res.status(200).json({ incomes });
        } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Internal server error" });
    }
}

export const getTodayOrdersData = async (req, res) => {
    const NOW = new Date()
    const TODAY_START = new Date(NOW.setHours(0, 0, 0, 0))
    try {
        const orders = await Orders.findAll({
            order: [
                ['createdAt', 'DESC']
            ],
            where: {
                createdAt: {
                    [Op.gt]: TODAY_START
                }
            }
        })
        const ordersData = await Promise.all(orders.map(async (order) => {
            const items = order.dataValues.items.split(',')
            const itemList = await Promise.all(items.map(async (i) => {
                const [code, quantity] = i.split(':')
                const product = await Items.findOne({ where: { code } })
                return {
                    itemName: product.name,
                    quantity
                }
            }))
            const orderTime = `${order.createdAt.getHours()}.${order.createdAt.getMinutes()}`
            const outlet = await Outlet.findOne({ where: { id: order.outlet } })
            // console.log(outlet)
            const profit = order.dataValues.profit
            return [itemList, orderTime, outlet.dataValues.name, order.totalPayment, profit]
        }))
        res.status(200).json(ordersData)
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: "Internal server error", error })
    }
}
