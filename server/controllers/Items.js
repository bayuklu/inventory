import { Op } from 'sequelize'
import Items from '../model/ItemsModel.js'

export const addItem = async(req, res) => {
    //list category [foods = FOO****, drinks = DRI****, bathroom = BAT****, kitchen = KIT****]
    const {name, category, price, stock, unit, unitPack, discount, capitalPrice} = req.body
    // console.log(typeof capitalPrice)

    if(!name || !price || !stock || !capitalPrice) return res.status(400).json({msg: "name, price, stock, or capital price field are required!"})

    if(discount > 100) return res.status(400).json({msg: "Discount most in range 0 - 100 %"})
    const convDiscount = isNaN(parseFloat(discount)) ? 0.0 : parseFloat(discount) / 100;

    async function createItemCode(_category) {
        let code
        let isUnique = false

        while(!isUnique){
            switch (category) {
                case "foods":
                    code = `FOO${Math.floor(Math.random() * 9000) + 1000}`
                    break;
                case "drinks":
                    code = `DRI${Math.floor(Math.random() * 9000) + 1000}`
                    break;
                case "bathroom":
                    code = `BAT${Math.floor(Math.random() * 9000) + 1000}`
                    break;
                case "kitchen":
                    code = `KIT${Math.floor(Math.random() * 9000) + 1000}`
                    break;
                default:
                    break;
            }
            const checkDuplicateDb = await Items.findOne({
                where: {
                    code: code
                }
            })
            if(!checkDuplicateDb) isUnique = true
        }

        return code
    }
    
    const toUpperCaseFirstStr = (str) => {
        let arr = [], finalArr = []
        str.split(' ').forEach(element => {
              arr.push(element)
        });
        arr.forEach(e => {finalArr.push(e.replace(/^\w/, (c) => c.toUpperCase()))})
      return finalArr.join(' ')
    }

    const parseCapitalPrice = Number(capitalPrice)

    try {
        const validCode = await createItemCode(category)
        await Items.create({
            code: validCode.toUpperCase(),
            name: name,
            category: category,
            price: price,
            stock: stock,
            unitTotal: unit,
            unitTotalPack: unitPack || 0,
            discount: convDiscount || 0.0,
            capitalPrice: parseCapitalPrice
        })

        const itemData = await Items.findAll({
            where: {category: category},
            attributes: ['id', 'code', 'name', 'category', 'price', 'price', 'stock', 'unitTotal', 'unitTotalPack', 'discount', 'capitalPrice']
        })
        res.status(200).json({
            msg: `${name.toUpperCase()} Successfully added`,
            dataView: [...itemData],

        })
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getAllItem = async(req, res) => {
    console.log(req.headers.origin)
    try {
        const get = await Items.findAll({
            attributes: ['id', 'code', 'name', 'category', 'price', 'price', 'stock', 'unitTotal', 'unitTotalPack', 'discount', 'capitalPrice'],
            limit: 100,
            order: [['name', 'ASC']]
        })
        return res.status(200).json({data: [...get]})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getFoods = async(req, res) => {
    try {
        const get = await Items.findAll({
            where: {
                category: 'foods'
            },
            attributes: ['id', 'code', 'name', 'category', 'price', 'price', 'stock', 'unitTotal', 'unitTotalPack', 'discount', 'capitalPrice'],
            order: [['name', 'ASC']]
        })
        return res.status(200).json({data: [...get]})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getDrinks = async(req, res) => {
    try {
        const get = await Items.findAll({
            where: {
                category: 'drinks'
            },
            attributes: ['id', 'code', 'name', 'category', 'price', 'price', 'stock', 'unitTotal', 'unitTotalPack', 'discount', 'capitalPrice'],
            order: [['name', 'ASC']]
        })
        return res.status(200).json({data: [...get]})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getBathroom = async(req, res) => {
    try {
        const get = await Items.findAll({
            where: {
                category: 'bathroom'
            },
            attributes: ['id', 'code', 'name', 'category', 'price', 'price', 'stock', 'unitTotal', 'unitTotalPack', 'discount', 'capitalPrice'],
            order: [['name', 'ASC']]
        })
        return res.status(200).json({data: [...get]})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const getKitchen = async(req, res) => {
    try {
        const get = await Items.findAll({
            where: {
                category: 'kitchen'
            },
            attributes: ['id', 'code', 'name', 'category', 'price', 'price', 'stock', 'unitTotal', 'unitTotalPack', 'discount', 'capitalPrice'],
            order: [['name', 'ASC']]
        })
        return res.status(200).json({data: [...get]})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const updateItem = async(req, res) => {
    const {name, price, stock, discount} = req.body
    const itemCode = req.params['kode']

    try {
        const item = await Items.findOne({
            where: {
                code: itemCode
            }
        })
        if(!item) return res.status(404).json({msg: "Item not found"})

        await item.update({
            name: name || item.name,
            price: price || item.price,
            stock: stock || item.stock,
            discount: discount || item.discount
        })

        res.status(200).json({msg: "Data updated!"})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }

}

export const deleteItem = async(req, res) => {
    const itemCode = req.params['kode']
    if(!itemCode) return res.status(400).json({msg: "error"})

    try {
        const item = await Items.findOne({
            where: {
                code: itemCode
            }
        })
        if(!item) return res.status(404).json({msg: "Item not found"})
        
        await item.destroy()

        res.status(200).json({
            msg: `"${item.name.toUpperCase()}" Deleted`
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "Internal server error"})
    }
}

export const addStock = async(req, res) => {
    const {stockAdded} = req.body
    if(!stockAdded) return res.status(400).json({msg: "Stock is required"})
    const itemCode = req.params['kode']

    try {
        const item = await Items.findOne({
            where: {
                code: itemCode
            }
        })
        if(!item) return res.status(404).json({msg: "Item not found"})

        item.stock += parseInt(stockAdded)
        await item.save()

        res.status(200).json({
            msg: `"${item.name.toUpperCase()}" Stock Changed to ${item.stock}`
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error.message})
    }
}

export const searchItem = async(req, res) => {
    const {value} = req.body
    if(!value) return res.status(400).json({msg: "Must insert a value"})
    try {
        const item = await Items.findAll({
            attributes: ['id', 'code', 'name', 'category', 'stock', 'unitTotal', 'discount', 'price', 'capitalPrice', 'unitTotalPack'],
            where: {
                [Op.or] : {
                    name : {
                        [Op.iLike] : `%${value}%`
                    },
                    code : {
                        [Op.iLike] : `%${value}%`
                    }
                }
            },
            order: [['name', 'ASC']]
        })
        if(item.length < 1) return res.status(404).json({msg: "Item not found"})
        res.status(200).json({data: item})
   } catch (error) {
        console.log(error)
        res.status(500).json({error: error.message})
    }
}

export const updateDus = async(req, res) => {
    const {itemId, newDusValue} = req.body
    if(!itemId || (!newDusValue && newDusValue !== 0)) return res.status(400).json({msg: "All field required!"})

    try {
        const item = await Items.findOne({
            where: {id: itemId}
        })
        if(!item) return res.status(404).json({msg: "Item not found!"})

        await item.update({
            unitTotal: newDusValue ?? item.unitTotal
        })

        res.status(200).json({msg: "Unit Total Dus Changed Successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error.message})
    }
}

export const updatePack = async(req, res) => {
    const {itemId, newPackValue} = req.body
    if(!itemId || (!newPackValue && newPackValue !== 0)) return res.status(400).json({msg: "All field required!"})

    try {
        const item = await Items.findOne({
            where: {id: itemId}
        })
        if(!item) return res.status(404).json({msg: "Item not found!"})
        // console.log(typeof(item.unitTotalPack))
        await item.update({
            unitTotalPack: newPackValue ?? item.unitTotalPack
        })

        res.status(200).json({msg: "Unit Total Pack Changed Successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error.message})
    }
}

export const updatePrice = async(req, res) => {
    const {itemId, newPriceValue} = req.body
    if(!itemId || (!newPriceValue && newPriceValue !== 0)) return res.status(400).json({msg: "All field required!"})

    try {
        const item = await Items.findOne({
            where: {id: itemId}
        })
        if(!item) return res.status(404).json({msg: "Item not found!"})

        if(newPriceValue < item.capitalPrice) {
            return res.status(400).json({msg: "Harga jual tidak boleh kurang dari harga modal"})
        }
        
        await item.update({
            price: newPriceValue ?? item.price
        })

        res.status(200).json({msg: "Price Changed Successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error.message})
    }
}

export const updateCapitalPrice = async(req, res) => {
    const {itemId, newCapitalPriceValue} = req.body
    if(!itemId || (!newCapitalPriceValue && newCapitalPriceValue !== 0)) return res.status(400).json({msg: "All field required!"})

    try {
        const item = await Items.findOne({
            where: {id: itemId}
        })
        if(!item) return res.status(404).json({msg: "Item not found!"})

        if(newCapitalPriceValue > item.price) {
            return res.status(400).json({msg: "Harga modal tidak boleh lebih dari harga jual"})
        }

        await item.update({
            capitalPrice: newCapitalPriceValue ?? item.capitalPrice
        })

        res.status(200).json({msg: "Capital Price Changed Successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error.message})
    }
}