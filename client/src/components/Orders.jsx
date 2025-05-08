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
    const [msg, setMsg] = useState(null);
    const [ordersData, setOrdersData] = useState([])
    const [token, setToken] = useState('')
    const [expire, setExpire] = useState('')
    const [isNoLoggedIn, setIsNoLoggedIn] = useState(false)
    const [authCheck, setAuthCheck] = useState(true)  
    const [isOrdersDataLoading, setIsOrdersDataLoading] = useState(false)
    const [changeSalesView, setChangeSalesView] = useState(false)
    const [salesBefore, setSalesBefore] = useState("")
    const [salesName, setSalesName] = useState("")
    const [outletName, setOutletName] = useState("")
    const [selectedTransactionSalesChange, setSelectedTransactionSalesChange] = useState(null)
    
    const salesList = ['--Ganti Sales--', 'Ana', 'Eman', 'Eva', 'Uyung', 'Dwik', 'Suhendri', 'Eja', 'Dian', 'Eyung']

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
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
    
      const worksheet1 = XLSX.utils.aoa_to_sheet([]);
    
      // Baris 1: Tanggal
      XLSX.utils.sheet_add_aoa(worksheet1, [[`Tanggal: ${formattedDate}`]], { origin: 'B1' });
    
      // Baris 3: Judul Data Penjualan
      XLSX.utils.sheet_add_aoa(worksheet1, [['ANA BASALIM FROZEN']], { origin: 'B3' });
    
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
    
      // Tabel penjualan mulai di baris 5
      XLSX.utils.sheet_add_json(worksheet1, ordersFormatted, { origin: 'B5' });
    
      // Kolom
      worksheet1['!cols'] = [
        { wch: 2 }, // Kolom A kosong (jarak)
        { wch: 3 }, 
        { wch: 20 }, 
        { wch: 6 }, 
        { wch: 12 }, 
        { wch: 8 }, 
        { wch: 8 }, 
        { wch: 8 }, 
        { wch: 8 }, 
        { wch: 5 },
      ];
    
      // Fungsi menghitung banyak order dan pendapatan
      const HitungBanyakOrderSales = (namaSales) =>
        ordersData.reduce((count, order) => (order[5] === namaSales ? count + 1 : count), 0);
    
      const hitungJumlahPendapatan = (namaSales) =>
        ordersData.reduce((total, order) => {
          if (order[5] === namaSales) {
            const jumlah = Number(order[3]);
            total += isNaN(jumlah) ? 0 : jumlah;
          }
          return total;
        }, 0);
    
      // Data Sales
      const newOrdersData = [
        { 'No': "", 'NAMA': 'Jumlah Setoran Sales ==>', 'S': 'Sales', 'JUMLAH': "Jumlah Order", 'SETOR 1': 'Jumlah Uang', 'SETOR 2': '', 'SETOR 3': '', 'SETOR 4': '', 'KET': '' },
        { 'No': "", 'NAMA': '', 'S': 'Eja', 'JUMLAH': HitungBanyakOrderSales("Eja"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Eja")) },
        { 'No': "", 'NAMA': '', 'S': 'Uyung', 'JUMLAH': HitungBanyakOrderSales("Uyung"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Uyung")) },
        { 'No': "", 'NAMA': '', 'S': 'Eva', 'JUMLAH': HitungBanyakOrderSales("Eva"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Eva")) },
        { 'No': "", 'NAMA': '', 'S': 'Dwik', 'JUMLAH': HitungBanyakOrderSales("Dwik"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Dwik")) },
        { 'No': "", 'NAMA': '', 'S': 'Suhendri', 'JUMLAH': HitungBanyakOrderSales("Suhendri"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Suhendri")) },
        { 'No': "", 'NAMA': '', 'S': 'Eman', 'JUMLAH': HitungBanyakOrderSales("Eman"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Eman")) },
        { 'No': "", 'NAMA': '', 'S': 'Ana', 'JUMLAH': HitungBanyakOrderSales("Ana"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Ana")) },
        { 'No': "", 'NAMA': '', 'S': 'Dian', 'JUMLAH': HitungBanyakOrderSales("Dian"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Dian")) },
        { 'No': "", 'NAMA': '', 'S': 'Eyung', 'JUMLAH': HitungBanyakOrderSales("Eyung"), 'SETOR 1': rupiah(hitungJumlahPendapatan("Eyung")) },
      ];
    
      // Baris awal tabel sales = 5 (start table) + ordersData.length (jumlah data) + 2 (judul sales + spasi)
      const startRowForSales = 5 + ordersFormatted.length + 2;
    
      // Judul Data Sales
      XLSX.utils.sheet_add_aoa(worksheet1, [['Data Sales']], { origin: `B${startRowForSales}` });
    
      // Tabel sales dimulai 1 baris setelah judul
      XLSX.utils.sheet_add_json(worksheet1, newOrdersData, {
        skipHeader: true,
        origin: `B${startRowForSales + 1}`
      });
    
      // Buat dan simpan file Excel
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, worksheet1, 'Data Laporan');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    
      FileSaver.saveAs(excelBlob, `${formattedDate}.xlsx`);
    };

    const handleHapusTransaksi = async (idTransaksi) => {
      if(confirm("Yakin ingin Menghapus Transaksi Ini?") === true) {
        try {
          const response = await axios.delete(`${import.meta.env.VITE_BASEURL}/dashboard/orders/${idTransaksi}`, {
            withCredentials: true
          })

          if(response) {
            await fetchData()
          }
        } catch (error) {
          console.error(error.message)
        }
      }
    }
    
    const handleSalesChangeOnClick = async() => {
      try {

        if(changeSalesView) {
          if(!salesName) return setMsg({ msg: "Pilih nama sales terlebih dahulu!", color: "red" });
          const response = await axios.put(`${import.meta.env.VITE_BASEURL}/dashboard/orders/sales`, {
            withCredentials: true,
            transactionId: selectedTransactionSalesChange,
            salesName: salesName
          })

          if(response) {
            fetchData()
            setChangeSalesView(!changeSalesView)
          }
        }
      } catch (error) {
        console.error(error.message)
      }
    }

    return (
        <div className='orders-container'>
          {msg ? (
            <>
              <div className="messages" style={{ backgroundColor: msg.color }}>
                <p>{msg.msg}</p>
                <p style={{ display: "none" }}>
                  {setTimeout(() => {
                    setMsg(null);
                  }, 3000)}
                </p>
              </div>
            </>
          ) : (
            ""
          )}
            <div className='tampilan-ganti-sales'
              style={{
                width: '100%',
                height: '100vh',
                position: 'fixed',
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: '10',
                display: changeSalesView ? 'flex' : 'none',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onClick={(e) => {
                setChangeSalesView(!changeSalesView)
              }}
            >
              <div
                style={{
                  width: '400px',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  padding: '20px',
                  gap: '10px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{color: "darkorange", fontWeight: 'bold'}}>{outletName.toUpperCase()}{` (${salesBefore})`}</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                  <select name="" id="" className='input' onChange={(e) => {setSalesName(e.target.value)}}>
                    {salesList.map((sales, index) => (
                      <option key={index} value={salesList === "--Ganti Sales--" ? "" : `${sales}`}>
                        {sales}
                      </option>
                    ))}
                  </select>
                  <button className='button' style={{backgroundColor: 'green', outline: 'none'}} onClick={handleSalesChangeOnClick}>Ubah</button>
                </div>
              </div>
            </div>
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
                            <p style={{fontWeight: 'bold', color: 'darkorange'}}>{`${data[2].toUpperCase()} ~ [${rupiah(data[3])}] ~ Profit = ${rupiah(data[4])} ====>>> Sales: `} 
                              <span style={{color: "lightgreen"}}> 
                                {`${data[5]}`} 
                                <i style={{color: 'lightgreen', marginLeft: '0px', cursor: 'pointer'}} onClick={(e) => {setChangeSalesView(!changeSalesView); setSalesBefore(data[5]); setOutletName(data[2]); setSelectedTransactionSalesChange(data[6])}}><CIcon style={{transform: 'scale(0.7)'}} icon={icon.cilPen}/></i>
                              </span>
                            </p>
                            <div style={{display: 'flex', gap: '5px'}}>
                              <i 
                                style={{ color: 'red', cursor: 'pointer'}} 
                                onClick={() => handleHapusTransaksi(data[6])}
                              >
                                <CIcon icon={icon.cilTrash} />
                              </i>
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