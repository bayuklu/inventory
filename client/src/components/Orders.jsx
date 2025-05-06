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
    const [isOrdersDataLoading, setIsOrdersDataLoading] = useState(false)
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
            setIsOrdersDataLoading(true)
            const response = await axios.get(`${import.meta.env.VITE_BASEURL}/dashboard/orders`)
            setOrdersData(response.data)
            setIsOrdersDataLoading(false)
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
      console.log('isi dari ordersData', ordersData);
    
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
    
      // Baris tanggal sebagai array of arrays
      const tanggalHeader = [
        [`LAPORAN ANA BASALIM FROZEN`],
        [`Tanggal: ${formattedDate}`]
      ];
    
      // Buat worksheet kosong
      const worksheet1 = XLSX.utils.aoa_to_sheet([]);
    
      // Tambahkan baris tanggal di A1
      XLSX.utils.sheet_add_aoa(worksheet1, tanggalHeader, { origin: 'A1' });
    
      // Format data ordersData
      const ordersFormatted = ordersData.map((order, index) => ({
        'No': index + 1,
        'NAMA': order[2].toUpperCase(),
        'S': order[5],
        'JUMLAH': rupiah(order[3]),
        'SETOR 1': "",
        'SETOR 2': "",
        'SETOR 3': "",
        'SETOR 4': "",
        'KET': "",
      }));
    
      // Tambahkan data utama di A3 (setelah tanggal dan 1 baris kosong)
      XLSX.utils.sheet_add_json(worksheet1, ordersFormatted, { origin: 'A3' });
    
      // Set kolom
      worksheet1['!cols'] = [
        { wch: 3 }, 
        { wch: 20 }, 
        { wch: 3 }, 
        { wch: 9 }, 
        { wch: 8 }, 
        { wch: 8 }, 
        { wch: 8 }, 
        { wch: 8 }, 
        { wch: 5 },
      ];
    
      // Fungsi menghitung banyak order
      const HitungBanyakOrderSales = (namaSales) => {
        return ordersData.reduce((count, order) => {
          if (order[5] === namaSales) count += 1;
          return count;
        }, 0);
      };
    
      // Fungsi menghitung jumlah pendapatan
      const hitungJumlahPendapatan = (namaSales) => {
        return ordersData.reduce((total, order) => {
          if (order[5] === namaSales) {
            console.log("order[3] : ", order[3], "order[5] : ", order[5]);
            total += Number(order[3]) || 0;
          }
          return total;
        }, 0);
      };
    
      const newOrdersData = [
        { 'No': "", 'NAMA': 'Jumlah Setoran Sales ==>', 'S': 'Sales', 'JUMLAH': "Jumlah Order", 'SETOR 1': 'Jumlah Uang', 'SETOR 2': '', 'SETOR 3': '', 'SETOR 4': '', 'KET': '' },
        { 'No': "", 'NAMA': '', 'S': 'Eja', 'JUMLAH': HitungBanyakOrderSales("Eja"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Eja")), 'SETOR 2': '', 'SETOR 3': '', 'SETOR 4': '', 'KET': '' },
        { 'No': "", 'NAMA': '', 'S': 'Uyung', 'JUMLAH': HitungBanyakOrderSales("Uyung"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Uyung")), 'SETOR 2': '', 'SETOR 3': '', 'SETOR 4': '', 'KET': '' },
        { 'No': "", 'NAMA': '', 'S': 'Eva', 'JUMLAH': HitungBanyakOrderSales("Eva"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Eva")), 'SETOR 2': '', 'SETOR 3': '', 'SETOR 4': '', 'KET': '' },
        { 'No': "", 'NAMA': '', 'S': 'Dwik', 'JUMLAH': HitungBanyakOrderSales("Dwik"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Dwik")), 'SETOR 2': '', 'SETOR 3': '', 'SETOR 4': '', 'KET': '' },
        { 'No': "", 'NAMA': '', 'S': 'Suhendri', 'JUMLAH': HitungBanyakOrderSales("Suhendri"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Suhendri")), 'SETOR 2': '', 'SETOR 3': '', 'SETOR 4': '', 'KET': '' },
        { 'No': "", 'NAMA': '', 'S': 'Eman', 'JUMLAH': HitungBanyakOrderSales("Eman"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Eman")), 'SETOR 2': '', 'SETOR 3': '', 'SETOR 4': '', 'KET': '' },
        { 'No': "", 'NAMA': '', 'S': 'Ana', 'JUMLAH': HitungBanyakOrderSales("Ana"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Ana")), 'SETOR 2': '', 'SETOR 3': '', 'SETOR 4': '', 'KET': '' },
        { 'No': "", 'NAMA': '', 'S': 'Dian', 'JUMLAH': HitungBanyakOrderSales("Dian"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Dian")), 'SETOR 2': '', 'SETOR 3': '', 'SETOR 4': '', 'KET': '' },
        { 'No': "", 'NAMA': '', 'S': 'Eyung', 'JUMLAH': HitungBanyakOrderSales("Eyung"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Eyung")), 'SETOR 2': '', 'SETOR 3': '', 'SETOR 4': '', 'KET': '' },
      ];
    
      // Hitung baris terakhir dari data pertama (plus 3 baris awal: tanggal, kosong, header)
      const startRowForSecondTable = ordersFormatted.length + 4;
    
      // Tambahkan tabel kedua
      XLSX.utils.sheet_add_json(worksheet1, newOrdersData, {
        skipHeader: true,
        origin: `A${startRowForSecondTable}`
      });
    
      // Buat dan simpan file Excel
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, worksheet1, 'Data Laporan');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
      FileSaver.saveAs(excelBlob, `${formattedDate}.xlsx`);
    };
    
  
  
    // console.log(ordersData)

    return (
        <div className='orders-container'>
            {/* <div className="formOrders">
                <form >
                    <input type="date" style={{width: '300px'}} />
                    <button className="button">Search</button>
                </form>
            </div> */}
            <a href="/" style={{marginLeft: '20px', marginTop: '20px', marginBottom: '20px', width: '20px'}}>
                <i style={{color: 'black'}}><CIcon icon={icon.cilMediaStepBackward}/></i>
            </a>
            <button className="button" style={{margin: "0px 20px"}} disabled={isOrdersDataLoading} onClick={handlePrint}>Simpan Data Transaksi Hari Ini</button>
            <div className="viewOrders">
              <div style={{width: "100%", display: "flex", justifyContent: "center"}}>
                {isOrdersDataLoading && <><SpinnerLoader color={"black"}/></>}
              </div>
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