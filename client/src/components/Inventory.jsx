import React, { act, useEffect } from 'react'
import Sidebar from './Sidebar'
import axios from 'axios'
import '../index.css'
import { useState } from 'react'
import {useNavigate} from 'react-router-dom'
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';


const Inventory = () => {
  const [msg, setMsg] = useState(null)
  const [items, setItems] = useState([])
  const [activeButton, setActiveButton] = useState('All Category')
  const [dataView, setDataView] = useState('')
  const [hideFormAddProduct, setHideFormAddProduct] = useState('hideFormAddProduct')
  const [hideFormAddStock, setHideFormAddStock] = useState('hideFormAddStock')
  
  const [name, setName] = useState('')
  const [category, setCategory] = useState('foods')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [unit, setUnit] = useState('')
  const [capitalPrice, setCapitalPrice] = useState('')
  const [discount, setDiscount] = useState('')

  const [codeAddStock, setCodeAddStock] = useState('')
  const [nameAddStock, setNameAddStock] = useState('')
  const [stockAddStock, setStockAddStock] = useState('')
  const [search, setSearch] = useState('')

  const [totalAddStock, setTotalAddStock] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    handleButtonClick('All Category')
    console.log(items)
  }, [])
  
  const addproduct = async(e) => {
    e.preventDefault()
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASEURL}/items`, {
        name: name,
        category: category,
        price: price,
        stock: stock,
        unit: unit,
        discount: discount,
        capitalPrice: parseInt(capitalPrice)
      })
      if(response) {
        setHideFormAddProduct('hideFormAddProduct')
        setActiveButton(response.data.activeButton)
        setItems(response.data.dataView)
        setMsg({msg: response.data.msg, color: 'green'})
      } 
    } catch (error) {
      setMsg({msg: error.response.data.msg, color: 'red'})
    }
  }

  const addstock = async(e) => {
    e.preventDefault()

    try {
      const response = await axios.put(`${import.meta.env.VITE_BASEURL}/items/stock/${codeAddStock}`, {
        stockAdded: totalAddStock,
        dataView: dataView
      })
      if(response) {
        setHideFormAddStock('hideFormAddStock')
        setStockAddStock(response.data.data)
        setItems(response.data.dataView)
        setMsg({msg: response.data.msg, color: 'green'})
      }
    } catch (error) {
      setMsg({msg: error.response.data.msg, color: 'red'})
    }
  }

  const handleDeleteItems = async(code, name) => {
    if(confirm(`Are you sure want to delete ${name.toUpperCase()}?`) != true) return
    try {
      const response = await axios.delete(`${import.meta.env.VITE_BASEURL}/items/${code}`, {
        data: {dataView: dataView}
      })
      if(response) {
        setItems(response.data.dataView)
        setMsg({msg: response.data.msg, color: 'green'})
      }
    } catch (error) {
      console.log(error)
      setMsg({msg: error.response.data.msg, color: 'red'})
    }
  }

  const handleButtonClick = async(category) => {
    setActiveButton(category)
    try {
      let response
      switch (category) {
        case 'Foods':
          response = await axios.get(`${import.meta.env.VITE_BASEURL}/items/foods`)
          setItems(response.data.data)
          setDataView(category)
          break;
        case 'Drinks':
          response = await axios.get('http://localhost:5000/items/drinks')
          setItems(response.data.data)
          setDataView(category)
          break;
        case 'Bathroom':
          response = await axios.get('http://localhost:5000/items/bathroom')
          setItems(response.data.data)
          setDataView(category)
          break;
        case 'Kitchen':
          response = await axios.get('http://localhost:5000/items/kitchen')
          setItems(response.data.data)
          setDataView(category)
          break;
        default:
          response = await axios.get('http://localhost:5000/items')
          setItems(response.data.data)
          setDataView(category)
          break;
      }
    } catch (error) {
      console.log(error)
      setMsg({msg: error.response.data.msg, color: 'red'})
    }
  }

  const rupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  const handleAddStock = (code, name, stock) => {
    setCodeAddStock(code)
    setNameAddStock(name)
    setStockAddStock(stock)
    setHideFormAddStock('')
  }

  const handleShowFormAddProduct = () => {
    setHideFormAddProduct('')
  }

  const handleHideFormAddProduct = () => {
    setHideFormAddProduct('hideFormAddProduct')
  }

  const handleHideFormAddStock = () => {
    setHideFormAddStock('hideFormAddStock')
  }

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleSearch = async(e) => {
    e.preventDefault()

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASEURL}/items/search`, {
        value: search
      })
      setDataView(search)
      setItems(response.data.data)
      setActiveButton('')
    } catch (error) {
      setItems([])
      setMsg({msg: error.response.data.msg, color: 'red'})
    }
  }

  const tableStyle = {
    width: '100%'
  }
  console.log(items)
  return (
    <div className='is-flex'>
        <Sidebar/>

        {msg ? 
            <>
                <div className='messages' style={{ backgroundColor: msg.color }}>
                    <p>{msg.msg}</p>
                    <p style={{display: 'none'}}>
                        {setTimeout(() => {setMsg(null)}, 3000)}
                    </p>
                </div>
            </>
            :
            ''
        }

        <div className="inventoryContainer">
            <div className="judul">
                <h1>Inventory</h1>
            </div>
            <div className="inventoryMenu">
                <ul>
                  <li>
                    <button className={activeButton === 'All Category' ? 'is-active-btn' : ''} onClick={() => handleButtonClick('All Category')}>All Category</button>
                  </li>
                  <li>
                    <button className={activeButton === 'Foods' ? 'is-active-btn' : ''} onClick={() => handleButtonClick('Foods')}>Foods</button>
                  </li>
                  <li>
                    <button className={activeButton === 'Drinks' ? 'is-active-btn' : ''} onClick={() => handleButtonClick('Drinks')}>Drinks</button>
                  </li>
                  <li>
                    <button className={activeButton === 'Bathroom' ? 'is-active-btn' : ''} onClick={() => handleButtonClick('Bathroom')}>Bathrooms</button>
                  </li>
                  <li>
                    <button className={activeButton === 'Kitchen' ? 'is-active-btn' : ''} onClick={() => handleButtonClick('Kitchen')}>Kithcens</button>
                  </li>
                  <li>
                    <button onClick={handleShowFormAddProduct}>Add Product</button>
                  </li>
                  <li>
                    <form onSubmit={handleSearch} style={{display: 'flex', alignItems: 'center', gap: '2px'}}>
                      <input placeholder='Search' type="text" className="searchItem" onChange={(e) => setSearch(e.target.value)} />
                      <button style={{width: '50px', height: '41px', border: 'none', color: 'white', display: 'flex', alignItems: 'center'}} type='submit' className='button'><i style={{lineHeight: '10px'}}><CIcon icon={icon.cilSearch}/></i></button>
                    </form>
                  </li>
                </ul>
            </div>
            <div className="tableContainer">
            <table style={tableStyle} className="table">
                    <thead>
                        <tr>
                            <th style={{color: 'white'}}><abbr title="Position">No</abbr></th>
                            <th style={{color: 'white'}}>Code</th>
                            <th style={{color: 'white'}}>Product Name</th>
                            <th style={{color: 'white'}}>Stock</th> 
                            <th style={{color: 'white'}}>Isi 1 Dus</th> 
                            <th style={{color: 'white'}}>Discount</th> 
                            <th style={{color: 'white'}}>Original Price</th> 
                            <th style={{color: 'white'}}>Capital Price</th> 
                            <th style={{color: 'white'}}>Control</th> 
                        </tr>
                    </thead>
                    <tbody>
                      {
                        items.map((item, index) => (
                          <tr key={index} className={item.stock <= 0 ? 'stockHabis' : ''}>
                            <td>{index + 1}</td>
                            <td>{item.code}</td>
                            <td>{item.name.toUpperCase()}</td>
                            <td>{item.stock} pcs</td>
                            <td>{item.unitTotal || 0} pcs</td>
                            <td>{item.discount * 100}%</td>
                            <td>{rupiah(item.price)}</td>
                            <td>{rupiah(item.capitalPrice)}</td>
                            <td>
                              <button style={{border: 'none', color: 'white', backgroundColor: 'darkgreen'}} onClick={() => handleAddStock(item.code, item.name, item.stock)} className='button is-small'>+ Stock</button>
                              <button style={{border: 'none', color: 'white', backgroundColor: 'darkred'}} onClick={() => handleDeleteItems(item.code, item.name)} className='button ml-3 is-small'>x</button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                </table>
            </div>

            {/* form add product */}
            <div onClick={handleHideFormAddProduct} className={`formAddProduct ${hideFormAddProduct}`}>
              <form onSubmit={addproduct} onClick={stopPropagation} action="">
                <div className="field">
                  <label style={{color: 'white'}} className="label">Product Name</label>
                  <div className="control">
                    <input className="input" type="text" placeholder="" value={name} onChange={(e) => setName(e.target.value)}/>
                  </div>
                  <p style={{color: 'white'}} className="help">Masukkan nama produk</p>
                </div>
                <div className="field">
                  <label style={{color: 'white'}} className="label">Category</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                    <select className='' name="category" id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="foods">Foods</option>
                      <option value="drinks">Drinks</option>
                      <option value="bathroom">Bathrooms</option>
                      <option value="kitchen">Kitchens</option>
                    </select>
                    </div>
                  </div>
                  <p style={{color: 'white'}} className="help">Pilih kategori produk</p>
                </div>
                <div className="field">
                  <label style={{color: 'yellow'}} className="label">Product Price</label>
                  <div className="control has-icons-left">
                    <input className="input" type="number" placeholder="" value={price} onChange={(e) => setPrice(e.target.value)}/>
                    <span className="icon is-small is-left">Rp</span>
                  </div>
                  <p style={{color: 'white'}} className="help">Masukkan harga produk</p>
                </div>
                <div className="field">
                  <label style={{color: 'white'}} className="label">Stock</label>
                  <div className="control">
                    <input className="input" type="number" placeholder="" value={stock} onChange={(e) => setStock(e.target.value)}/>
                  </div>
                  <p style={{color: 'white'}} className="help">Masukkan stok produk</p>
                </div>
                <div className="field">
                  <label style={{color: 'white'}} className="label">Isi Stock Dalam 1 Dus</label>
                  <div className="control">
                    <input className="input" type="number" placeholder="" value={unit} onChange={(e) => setUnit(e.target.value)}/>
                  </div>
                  <p style={{color: 'white'}} className="help">Masukkan isi dalam 1 dus</p>
                </div>
                <div className="field">
                  <label style={{color: 'yellow'}} className="label">Capital Price</label>
                  <div className="control has-icons-left">
                    <input className="input" type="number" placeholder="" value={capitalPrice} onChange={(e) => setCapitalPrice(e.target.value)}/>
                    <span className="icon is-small is-left">Rp</span>
                  </div>
                  <p style={{color: 'white'}} className="help">Masukkan harga modal</p>
                </div>
                <div className="field">
                  <label style={{color: 'white'}} className="label">Discount</label>
                  <div className="control has-icons-right">
                    <input className="input" type="number" placeholder="" value={discount} onChange={(e) => setDiscount(e.target.value)}/>
                    <span className='icon is-small is-right'>%</span>
                  </div>
                  <p style={{color: 'white'}} className="help">Tambahkan diskon (jika perlu)</p>
                </div>
                <button className='button is-success is-fullwidth'>Add</button>
              </form>
            </div>

            {/* form tambah stock */}
            <div onClick={handleHideFormAddStock} className={`formAddStock ${hideFormAddStock}`}>
              <form onSubmit={addstock} onClick={stopPropagation} action="">
              <div style={{color: 'white'}} className="label stockNameInfo">{nameAddStock.toUpperCase()}</div>
                <div className="field">
                  <div style={{color: 'white'}} className="label">Current Stock: {stockAddStock}</div>
                  <div className="control is-flex has-icons-left">
                    <input type="hidden" className='input' value={codeAddStock}/>
                    <input type="number" className='input' value={totalAddStock} onChange={(e) => setTotalAddStock(e.target.value)}/>
                    <span className='icon is-left is-small'>+</span>
                    <button className='button ml-3 is-primary'>Add Stock</button>
                  </div>
                </div>
              </form>
            </div>
        </div>
    </div>
  )
}

export default Inventory