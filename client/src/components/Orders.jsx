import React, { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import XLSX from 'xlsx/dist/xlsx.full.min.js';
import FileSaver from 'file-saver';
import { useNavigate } from 'react-router-dom';
import SpinnerLoader from "./SpinnerLoader";
import { jwtDecode } from 'jwt-decode';

const Orders = () => {
    const [ordersData, setOrdersData] = useState([])
    const [token, setToken] = useState('')
    const [expire, setExpire] = useState('')
    const [isNoLoggedIn, setIsNoLoggedIn] = useState(false)
    const [authCheck, setAuthCheck] = useState(true)  
    const navigate = useNavigate()

    useEffect(() => {
        refreshToken()
    }, [])

    useEffect(() => {
        if (token) {
          try {
            const decoded = jwtDecode(token)
            if (decoded.role === "admin") {
              fetchData()
            }
          } catch (error) {
            console.error("Token decoding failed:", error)
          }
        }
      }, [token])

    const refreshToken = async () => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASEURL}/token`,
            {
              withCredentials: true,
            }
          );
          
          const decoded = jwtDecode(response.data.accessToken);
          
          if(decoded.role !== "admin" && decoded.role === "kasir") {
            navigate("/cashier")
          }

          setToken(response.data.accessToken);
          setExpire(decoded.exp);
          setIsNoLoggedIn(false);
    
        } catch (error) {
          if (error.response) {
            setIsNoLoggedIn(true);
            navigate("/login");
          }
        } finally {
          setAuthCheck(false);
        }
      };
    
      const axiosJWT = axios.create();
      axiosJWT.interceptors.request.use(async (config) => {
          const currentDate = new Date();
          if (expire * 1000 < currentDate.getTime()) {
              const response = await axios.get(`${import.meta.env.VITE_BASEURL}/token`);
              config.headers.Authorization = `Bearer ${response.data.accessToken}`;
              setToken(response.data.accessToken);
              const decoded = jwtDecode(response.data.accessToken);
              setExpire(decoded.exp);
          }
          return config;
      }, (error) => {
          return Promise.reject(error);
      });  
    
      if (authCheck) {
        return (
          <div
            style={{
              width: "100%",
              height: "100vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <SpinnerLoader color={"black"} width={"100px"} />
          </div>
        );
      }
    
      if (isNoLoggedIn) {
        return null;
      }

    const fetchData = async() => {
        try{
            const response = await axios.get(`${import.meta.env.VITE_BASEURL}/dashboard/orders`)
            setOrdersData(response.data)
        }catch(error){
            console.log(error.message)
        }
    }

    const rupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number).replace('IDR', 'Rp').trim();
    };

    const handlePrint = () => {
        console.log('isi dari ordersData', ordersData)
        const worksheet = XLSX.utils.json_to_sheet(ordersData.map((order, index) => ({
            'No': index + 1,
            'NAMA': order[2].toUpperCase(),
            'JUMLAH': rupiah(order[3]),
            'SALES': order[5],
            'SETORAN': "",
            'KET': ""
        })))

        worksheet['!cols'] = [
            { wch: 5 }, 
            { wch: 30 }, 
            { wch: 10 }, 
            { wch: 10 }, 
            { wch: 10 },
            { wch: 10 }  
        ];

        const range = XLSX.utils.decode_range(worksheet['!ref']);

        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            const cell = worksheet[cell_ref];
      
            if (cell) {
              cell.s = {
                border: {
                  top:    { style: "thin", color: { auto: 1 } },
                  right:  { style: "thin", color: { auto: 1 } },
                  bottom: { style: "thin", color: { auto: 1 } },
                  left:   { style: "thin", color: { auto: 1 } }
                },
                alignment: {
                  vertical: "center",
                  horizontal: "center",
                  wrapText: true
                }
              };
            }
          }
        }        

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, worksheet, 'Data Laporan');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const tanggal = String(new Date().getDate()).padStart(2, '0')
        const bulan = String(new Date().getMonth()).padStart(2, '0')
        const tahun = new Date().getFullYear()

        FileSaver.saveAs(excelBlob, `${tanggal}-${bulan}-${tahun}.xlsx`);
    }
    // console.log(ordersData)

    return (
        <div className='orders-container'>
            {/* <div className="formOrders">
                <form >
                    <input type="date" style={{width: '300px'}} />
                    <button className="button">Search</button>
                </form>
            </div> */}
            <a href="/" style={{marginLeft: '20px', marginTop: '20px', width: '20px'}}>
                <i style={{color: 'black'}}><CIcon icon={icon.cilMediaStepBackward}/></i>
            </a>
            <button className="button" style={{margin: "0px 20px"}} onClick={handlePrint}>Simpan Data Transaksi Hari Ini</button>
            <div className="viewOrders">
                {ordersData.map((data, index) => (
                    <div key={index} className='orders'>
                        <div className="infoOrders">
                            <p style={{fontWeight: 'bold', color: 'darkorange'}}>{`${data[2].toUpperCase()} ~ [${rupiah(data[3])}] ~ Profit = ${rupiah(data[4])} ====>>> Sales: ${data[5]}`}</p>
                            <div style={{display: 'flex', gap: '5px'}}>
                                <i style={{color: 'white'}}><CIcon icon={icon.cilClock}/></i>
                                <p style={{color: '#fff'}}>{data[1]}</p>
                            </div>
                        </div>
                        <div className='itemOrders'>
                            {data[0].map((item, i) => (
                                <div key={i} className='itemOrder'>
                                    <p>{item.itemName.toUpperCase()}</p>
                                    <p>{`x ${item.quantity}`}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Orders