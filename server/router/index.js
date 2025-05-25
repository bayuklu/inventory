import express, { Router } from "express";
import { addItem, getAllItem, getFoods, getDrinks, getBathroom, getKitchen, updateItem, deleteItem, addStock, searchItem, updateDus, updatePack, updatePrice, updateCapitalPrice } from "../controllers/Items.js";
import {getTurnCode, getRecordsByTurnCode, createRecordOrder, createFinalOrder, changePriceForSelectedItem, deleteRecordOrder, getRequestPrintFromAdmin, getRecordOrdersFromAdminRequest, setOrderIsPrinted, changeQuantityRecord} from "../controllers/orders.js"
import {getTotalOfItemsStock, getTotalOFItemsProduct, getTodayOrders, getTodayIncomes, getLast7DaysIncomes, getBestSeller, getTodayBestSeller, getTodayOrdersData, getTodayProfit, deleteTransaction, changeSalesName, getItemListForTodayOrders, getOutletForTodayOrders, getTagihanIn7DayMore, getOutletName, lunaskanTagihan} from "../controllers/dashboard.js"
import { addOutlet, deleteOutlet, getOutlet, searchOutlet, updateOutlet } from "../controllers/outlet.js";
import { isUserLoggedIn, Login, Logout, Register } from '../controllers/user.js'
import { refreshToken } from '../controllers/refreshToken.js'

const router = express.Router()

router.post('/login', Login)
router.post('/register', Register)
router.get('/login', isUserLoggedIn)
router.get('/token', refreshToken)
router.delete('/logout', Logout)

//router inventory
router.post('/items', addItem)
router.put('/items/:kode', updateItem)
router.delete('/items/:kode', deleteItem)
router.get('/items', getAllItem)
router.put('/items/stock/:kode', addStock)
//get item berdasarkan kategori
router.get('/items/foods', getFoods)
router.get('/items/drinks', getDrinks)
router.get('/items/bathroom', getBathroom)
router.get('/items/kitchen', getKitchen)
router.post('/items/search', searchItem)
router.put('/items/update/dus', updateDus)
router.put('/items/update/pack', updatePack)
router.put('/items/update/price', updatePrice)
router.put('/items/update/capitalprice', updateCapitalPrice)

//router cashier
router.get('/record/code', getTurnCode)
router.get('/record/turncode/:turnCode', getRecordsByTurnCode)
router.post('/record', createRecordOrder)
router.post('/record/changePrice', changePriceForSelectedItem)
router.delete('/record/:recordId', deleteRecordOrder)
router.put('/record/quantity', changeQuantityRecord)
router.post('/orders', createFinalOrder)
router.get('/orders/adminRequest', getRequestPrintFromAdmin)
router.put('/orders/adminRequest/:turnCode', setOrderIsPrinted)
router.get('/orders/adminRequest/orderRecord/:turnCode', getRecordOrdersFromAdminRequest)

//router main dashboard
router.get('/dashboard/stock', getTotalOfItemsStock)
router.get('/dashboard/items', getTotalOFItemsProduct)
router.get('/dashboard/todayOrders', getTodayOrders)
router.get('/dashboard/todayIncome', getTodayIncomes)
router.get('/dashboard/todayProfit', getTodayProfit)
router.get('/dashboard/last6DaysIncome', getLast7DaysIncomes)
router.get('/dashboard/bestseller', getBestSeller)
router.get('/dashboard/todayBestSeller', getTodayBestSeller)
router.get('/dashboard/tagihan7hari/:isMore/:latestDateShowed', getTagihanIn7DayMore)
router.put('/dashboard/tagihan7hari', lunaskanTagihan)
router.get('/dashboard/outlet/:outletId', getOutletName)

//router transaksi today orders
router.get('/dashboard/orders', getTodayOrdersData)
router.get('/dashboard/orders/itemList/:code', getItemListForTodayOrders)
router.get('/dashboard/orders/outlet/:id', getOutletForTodayOrders)
router.delete('/dashboard/orders/:transactionId', deleteTransaction)
router.put('/dashboard/orders/sales', changeSalesName)

//router outlet
router.post('/outlet', addOutlet)
router.get('/outlet', getOutlet)
router.delete('/outlet/:outletId', deleteOutlet)
router.put('/outlet', updateOutlet)
router.post('/outlet/search', searchOutlet)

export default router