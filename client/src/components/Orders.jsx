import React, { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import XLSX from 'xlsx/dist/xlsx.full.min.js';
import FileSaver from 'file-saver';

const Orders = () => {
    const [ordersData, setOrdersData] = useState([])
    useEffect(() => {
        fetchData()
    }, [])

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
        const worksheet = XLSX.utils.json_to_sheet(ordersData.map(order => ({
            'Nama Toko': order[2],
            'Barang Yang Dibeli': Array.isArray(order[0]) 
                ? order[0].map(item => `[${item.itemName} x${item.quantity}pcs]`).join(', ') 
                : '',
            'Total Belanja': rupiah(order[3]),
            'Keuntungan': rupiah(order[4]),
            'Waktu': order[1]
        })))

        worksheet['!cols'] = [
            { wch: 20 }, // Lebar kolom 'Nama Toko'
            { wch: 50 }, // Lebar kolom 'Barang Yang Dibeli'
            { wch: 15 }, // Lebar kolom 'Total Belanja'
            { wch: 15 }, // Lebar kolom 'Keuntungan'
            { wch: 20 }  // Lebar kolom 'Waktu'
        ];

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
            <button className="button" onClick={handlePrint}>Simpan Data Hari Ini</button>
            <div className="viewOrders">
                {ordersData.map((data, index) => (
                    <div key={index} className='orders'>
                        <div className="infoOrders">
                            <p style={{fontWeight: 'bold', color: 'darkorange'}}>{`${data[2].toUpperCase()} ~ [${rupiah(data[3])}] ~ Profit = ${rupiah(data[4])}`}</p>
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