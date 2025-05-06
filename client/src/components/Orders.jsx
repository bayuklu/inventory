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
  
      // Membuat worksheet pertama dari ordersData
      const worksheet1 = XLSX.utils.json_to_sheet(ordersData.map((order, index) => ({
          'No': index + 1,
          'NAMA': order[2].toUpperCase(),
          'S': order[5],
          'JUMLAH': rupiah(order[3]),
          'SETOR 1': "",
          'SETOR 2': "",
          'SETOR 3': "",
          'SETOR 4': "",
          'KET': "",
      })));
  
      // Tentukan lebar kolom untuk worksheet pertama
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
  
      
      const HitungBanyakOrderSales = (namaSales) => {
        const countSales = ordersData.reduce((count, order) => {
          if (order[5] === namaSales) {
              count += 1;
          }
          return count;
        }, 0);
        
        return countSales
      }

      const hitungJumlahPendapatan = (namaSales) => {
        const countPendapatan = ordersData.reduce((count, order) => {
          if(order[5] === namaSales) {
            console.log(order[3])
            count += order[3]
          }
          return count
        })

        return countPendapatan
      }

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
  
      // Menambahkan data tabel kedua ke bawah tabel pertama
      // Cari baris terakhir dari worksheet pertama
      const lastRow = worksheet1['!ref'].split(':')[1].replace(/[A-Za-z]/g, '');
      const startRowForSecondTable = parseInt(lastRow) + 2; // Menambahkan jarak 2 baris di bawah tabel pertama
  
      // Menambahkan data tabel kedua ke worksheet
      XLSX.utils.sheet_add_json(worksheet1, newOrdersData, { 
          skipHeader: true, 
          origin: `A${startRowForSecondTable}` 
      });
  
      // Buat workbook baru
      const wb = XLSX.utils.book_new();
  
      // Menambahkan worksheet pertama (dengan kedua tabel) ke dalam workbook
      XLSX.utils.book_append_sheet(wb, worksheet1, 'Data Laporan');
  
      // Generate file Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
      // Format tanggal untuk nama file
      const tanggal = String(new Date().getDate()).padStart(2, '0');
      const bulan = String(new Date().getMonth()).padStart(2, '0');
      const tahun = new Date().getFullYear();
  
      // Simpan file Excel
      FileSaver.saveAs(excelBlob, `${tanggal}-${bulan}-${tahun}.xlsx`);
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