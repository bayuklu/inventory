import React, { useEffect, useRef } from "react";
import axios from "axios";
import { useState } from "react";
import CIcon from "@coreui/icons-react";
import * as icon from "@coreui/icons";
import XLSX from "xlsx/dist/xlsx.full.min.js";
import FileSaver from "file-saver";
import { useNavigate } from "react-router-dom";
import SpinnerLoader from "./SpinnerLoader";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/confetti.css";
import { convertStringCaleToIndonesiaFormat } from "../utils/indonesianDate";

dayjs.extend(utc);
dayjs.extend(timezone);

const Orders = () => {
  const [msg, setMsg] = useState(null);
  const [ordersData, setOrdersData] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [isNoLoggedIn, setIsNoLoggedIn] = useState(false);
  const [authCheck, setAuthCheck] = useState(true);
  const [isOrdersDataLoading, setIsOrdersDataLoading] = useState(false);
  const [changeSalesView, setChangeSalesView] = useState(false);
  const [salesBefore, setSalesBefore] = useState("");
  const [salesName, setSalesName] = useState("");
  const [outletName, setOutletName] = useState("");
  const [selectedTransactionSalesChange, setSelectedTransactionSalesChange] =
    useState(null);

  const [dateView, setDateView] = useState(`${new Date(new Date()).getMonth() + 1}/${new Date(new Date()).getDate()}/${new Date(new Date()).getFullYear()}`)
    
  const calendarRef = useRef();
  const [isDateChanged, setIsDateChanged] = useState(false);

  const salesList = [
    "--Ganti Sales--",
    "Ana",
    "Eman",
    "Eva",
    "Uyung",
    "Dwik",
    "Suhendri",
    "Eja",
    "Dian",
    "Eyung",
  ];

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "AB FROZEN | Today Orders";
    refreshToken();
  }, []);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === "admin" && isDateChanged === false) {
          const tanggalku = dayjs().tz("Asia/Makassar").toDate();
          fetchData(tanggalku);
          console.log("ini dari useEffect");
        } else {
          setIsDateChanged(true);
        }
      } catch (error) {
        console.error("Token decoding failed:", error);
      }
    }
  }, [token, isDateChanged]);

  // useEffect(() => {
  //   if(token) {
  //     console.log(calendarRef.current.querySelector(".flatpickr-input").placeholder)
  //   }
  // }, [token, calendarRef])

  const refreshToken = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASEURL}/token`,
        {
          withCredentials: true,
        }
      );

      const decoded = jwtDecode(response.data.accessToken);

      if (decoded.role !== "admin" && decoded.role === "kasir") {
        navigate("/cashier");
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
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const response = await axios.get(
          `${import.meta.env.VITE_BASEURL}/token`
        );
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwtDecode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

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

  //ini fungsi dinamis tapi komplex karena request parameter yang berbeda type data asw
  const fetchData = async (fixDate) => {
    const regex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!fixDate) {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const date = String(today.getDate()).padStart(2, "0");
      const year = String(today.getFullYear());
      const newInput = `${month}/${date}/${year}`;
      const [month2, day2, year2] = newInput.split("/");
      const formatted = `${day2.padStart(2, "0")}-${month2.padStart(2,"0")}-${year2}`;
      const [day3, month3, year3] = formatted.split("-").map(Number);
      const dateObj = new Date(year3, month3 - 1, day3);
      fixDate = dateObj.toString();

    } else if (regex.test(fixDate)) {
      const input = fixDate;
      const [month, day, year] = input.split("/");
      const formatted = `${day.padStart(2, "0")}-${month.padStart(2,"0")}-${year}`;
      const [day2, month2, year2] = formatted.split("-").map(Number);
      const dateObj = new Date(year2, month2 - 1, day2);
      fixDate = dateObj.toString();
    }

    try {
      setIsOrdersDataLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BASEURL}/dashboard/orders/${fixDate}`
      );
      if (response) {
        const { orders } = response.data;
        const ordersData = await Promise.all(
          orders.map(async (order) => {
            const rawItems = order.items;
            const items = rawItems.includes(",")
              ? rawItems.split(",")
              : [rawItems];
            const itemList = await Promise.all(
              items.map(async (i) => {
                const [code, quantity] = i.split(":");
                try {
                  const product = await axios.get(
                    `${
                      import.meta.env.VITE_BASEURL
                    }/dashboard/orders/item/list/${code}`
                  );
                  return { itemName: product.data.name, quantity };
                } catch (error) {
                  if(error.response.status === 404) {
                    return { itemName: "- dihapus / tidak tersedia -", quantity };
                  }
                }
              })
            );
            const convertedTime = dayjs
              .utc(order.createdAt)
              .tz(`Asia/Makassar`)
              .format(`HH:mm`);

            let name
            try {
              const outlet = await axios.get(
                `${import.meta.env.VITE_BASEURL}/dashboard/orders/outlet/name/${
                  order.outlet
                }`
              );
              // console.log(outlet)
              name = outlet.data.name
            } catch (error) {
              console.log(error)
              if(error.response.status === 404) {
                name = "OUTLET TIDAK TERSEDIA / DIHAPUS"
              }
            }
            
            const profit = order.profit;
            const sales = order.sales;
            const keterangan = order.isBon ? "TEMPO" : "CASH"
            return [
              itemList,
              convertedTime,
              name,
              order.totalPayment,
              profit,
              sales,
              order.id,
              keterangan
            ];
          })
        );
        setOrdersData(ordersData);
        setIsOrdersDataLoading(false);
      }
    } catch (error) {
      setIsOrdersDataLoading(false);
      setOrdersData([]);
      console.log(error.message);
    }finally {
      if(new Date(fixDate).getTime() % 10000 === 0) {
        setDateView(
          convertStringCaleToIndonesiaFormat(
            `${new Date(fixDate).getMonth() + 1}/${new Date(fixDate).getDate()}/${new Date(fixDate).getFullYear()}`
          )
        )
      }else {
        setDateView(
          convertStringCaleToIndonesiaFormat(
            `${new Date(new Date()).getMonth() + 1}/${new Date(new Date()).getDate()}/${new Date(new Date()).getFullYear()}`
          )
        )
      }
    }
  };

  const rupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(number)
      .replace("IDR", "Rp")
      .trim();
  };

  const handleExport = () => {
    if(ordersData.length < 1) {
      return setMsg({
        msg: "Gagal Export, Data Kosong!",
        color: "red",
      });
    }
    // const tanggal = new Date();
    let formattedDate =
      calendarRef.current.querySelector(".flatpickr-input").value;

    if (!formattedDate) {
      const date = new Date();

      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();

      formattedDate = convertStringCaleToIndonesiaFormat(`${month}/${day}/${year}`);
    }else {
      formattedDate = convertStringCaleToIndonesiaFormat(formattedDate)
    }

    const worksheet1 = XLSX.utils.aoa_to_sheet([]);

    // Baris 1: Tanggal
    XLSX.utils.sheet_add_aoa(worksheet1, [[`Tanggal: ${formattedDate}`]], {
      origin: "B1",
    });

    // Baris 3: Judul Data Penjualan
    XLSX.utils.sheet_add_aoa(worksheet1, [["ANA BASALIM FROZEN"]], {
      origin: "B3",
    });

    // Format data ordersData
    const ordersFormatted = ordersData.map((order, index) => ({
      No: index + 1,
      NAMA: order[2].toUpperCase(),
      S: order[5],
      JUMLAH: rupiah(order[3]),
      "SETOR 1": "",
      "SETOR 2": "",
      "SETOR 3": "",
      "SETOR 4": "",
      KET: order[7],
    }));

    // Tabel penjualan mulai di baris 5
    XLSX.utils.sheet_add_json(worksheet1, ordersFormatted, { origin: "B5" });

    // Kolom
    worksheet1["!cols"] = [
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
      ordersData.reduce(
        (count, order) => (order[5] === namaSales ? count + 1 : count),
        0
      );

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
      {
        No: "",
        NAMA: "Jumlah Setoran Sales ==>",
        S: "Sales",
        JUMLAH: "Jumlah Order",
        "SETOR 1": "Jumlah Uang",
        "SETOR 2": "",
        "SETOR 3": "",
        "SETOR 4": "",
        KET: "",
      },
      {
        No: "",
        NAMA: "",
        S: "Eja",
        JUMLAH: HitungBanyakOrderSales("Eja"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Eja")),
      },
      {
        No: "",
        NAMA: "",
        S: "Uyung",
        JUMLAH: HitungBanyakOrderSales("Uyung"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Uyung")),
      },
      {
        No: "",
        NAMA: "",
        S: "Eva",
        JUMLAH: HitungBanyakOrderSales("Eva"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Eva")),
      },
      {
        No: "",
        NAMA: "",
        S: "Dwik",
        JUMLAH: HitungBanyakOrderSales("Dwik"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Dwik")),
      },
      {
        No: "",
        NAMA: "",
        S: "Suhendri",
        JUMLAH: HitungBanyakOrderSales("Suhendri"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Suhendri")),
      },
      {
        No: "",
        NAMA: "",
        S: "Eman",
        JUMLAH: HitungBanyakOrderSales("Eman"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Eman")),
      },
      {
        No: "",
        NAMA: "",
        S: "Ana",
        JUMLAH: HitungBanyakOrderSales("Ana"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Ana")),
      },
      {
        No: "",
        NAMA: "",
        S: "Dian",
        JUMLAH: HitungBanyakOrderSales("Dian"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Dian")),
      },
      {
        No: "",
        NAMA: "",
        S: "Eyung",
        JUMLAH: HitungBanyakOrderSales("Eyung"),
        "SETOR 1": rupiah(hitungJumlahPendapatan("Eyung")),
      },
    ];

    // Baris awal tabel sales = 5 (start table) + ordersData.length (jumlah data) + 2 (judul sales + spasi)
    const startRowForSales = 5 + ordersFormatted.length + 2;

    // Judul Data Sales
    XLSX.utils.sheet_add_aoa(worksheet1, [["Data Sales"]], {
      origin: `B${startRowForSales}`,
    });

    // Tabel sales dimulai 1 baris setelah judul
    XLSX.utils.sheet_add_json(worksheet1, newOrdersData, {
      skipHeader: true,
      origin: `B${startRowForSales + 1}`,
    });

    // Buat dan simpan file Excel
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, worksheet1, "Data Laporan");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const excelBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    FileSaver.saveAs(excelBlob, `Laporan ${formattedDate}.xlsx`);
  };

  const handleHapusTransaksi = async (idTransaksi) => {
    // console.log(idTransaksi);
    if (confirm("Yakin ingin Menghapus Transaksi Ini?") === true) {
      try {
        const response = await axios.delete(
          `${import.meta.env.VITE_BASEURL}/dashboard/orders/${idTransaksi}`,
          {
            withCredentials: true,
          }
        );

        if (response) {
          await fetchData(
            calendarRef.current.querySelector(".flatpickr-input").value
          );
        }
      } catch (error) {
        console.error(error.message);
      }
    }
  };

  const handleSalesChangeOnClick = async () => {
    try {
      if (changeSalesView) {
        if (!salesName)
          return setMsg({
            msg: "Pilih nama sales terlebih dahulu!",
            color: "red",
          });
        const response = await axios.put(
          `${import.meta.env.VITE_BASEURL}/dashboard/orders/sales`,
          {
            withCredentials: true,
            transactionId: selectedTransactionSalesChange,
            salesName: salesName,
          }
        );

        if (response) {
          fetchData(
            calendarRef.current.querySelector(".flatpickr-input").value
          );
          setChangeSalesView(!changeSalesView);
        }
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <div className="orders-container">
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
      {/* Start Tampian Ganti Sales */}
      <div
        className="tampilan-ganti-sales"
        style={{
          width: "100%",
          height: "100vh",
          position: "fixed",
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: "10",
          display: changeSalesView ? "flex" : "none",
          justifyContent: "center",
          alignItems: "center",
        }}
        onClick={(e) => {
          setChangeSalesView(!changeSalesView);
        }}
      >
        <div
          style={{
            width: "400px",
            backgroundColor: "white",
            borderRadius: "10px",
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            padding: "20px",
            gap: "10px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ color: "darkorange", fontWeight: "bold" }}>
            {outletName.toUpperCase()}
            {` (${salesBefore})`}
          </h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <select
              name=""
              id=""
              className="input"
              onChange={(e) => {
                setSalesName(e.target.value);
              }}
            >
              {salesList.map((sales, index) => (
                <option
                  key={index}
                  value={salesList === "--Ganti Sales--" ? "" : `${sales}`}
                >
                  {sales}
                </option>
              ))}
            </select>
            <button
              className="button"
              style={{ backgroundColor: "green", outline: "none" }}
              onClick={handleSalesChangeOnClick}
            >
              Ubah
            </button>
          </div>
        </div>
      </div>
      {/* End Tampian Ganti Sales */}

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px",
          backgroundColor: "black",
        }}
      >
        <a
          href="/"
          style={{
            width: "20px",
          }}
        >
          <i style={{ color: "#fff" }}>
            <CIcon icon={icon.cilMediaStepBackward} />
          </i>
        </a>
        <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  height: "50px",
                  alignItems: "center",
                  margin: "0px 15px",
                  borderBottom: "1px solid #fff",
                  padding: "0px 10px",
                  pointerEvents: "none"
                }}
              >
                <p style={{color: "#fff", fontWeight: "normal", fontSize: "13px"}}>Tanggal: {dateView}</p>
              </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
            ref={calendarRef}
          >
            <Flatpickr
              style={{
                height: "50px",
                width: "20px",
                padding: "10px",
                borderRadius: "10px",
                border: "3px solid grey",
                paddingRight: "40px",
                color: "transparent"
              }}
              placeholder={!isDateChanged ? "Hari Ini" : ""}
              onChange={([date]) => {
                const flatDate = dayjs(date).tz("Asia/Makassar").toDate();
                const convDate = flatDate.toLocaleDateString();
                const convLocDate = dayjs().tz("Asia/Makassar").toDate();
                const locDate = convLocDate.toLocaleDateString();
                // console.log(convDate);
                // console.log(locDate);
                if (convDate !== locDate) {
                  fetchData(flatDate);
                  setIsDateChanged(true)
                } else {
                  fetchData(convLocDate);
                  setIsDateChanged(false);
                }
              }}
              options={{
                dateFormat: "m/d/Y",
              }}
            />
            <i
              style={{
                position: "absolute",
                right: "15.5px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "darkorange",
                pointerEvents: "none",
              }}
            >
              <CIcon icon={icon.cilCalendar} />
            </i>
          </div>
          <div>
            <button
              className="button"
              style={{
                margin: "0px 20px",
                backgroundColor: "green",
                border: "none",
                height: "50px",
              }}
              disabled={isOrdersDataLoading}
              onClick={handleExport}
            >
              Export ke Excel
            </button>
          </div>
        </div>
      </div>

      {isOrdersDataLoading ? (
        <div
          style={{
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <SpinnerLoader color={"black"} width={"100px"} />
        </div>
      ) : (
        <div
          className="viewOrders"
          style={{ position: "relative", minHeight: "90vh" }}
        >
          {ordersData.length < 1 ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <p>Belum ada data transaksi</p>
            </div>
          ) : (
            <>
              {ordersData.map((data, index) => (
                <div
                  key={index}
                  className="orders"
                  style={{ backgroundColor: "#fff" }}
                >
                  <div className="infoOrders">
                    <p style={{ fontWeight: "bold", color: "darkorange" }}>
                      {`${data[2].toUpperCase()} ~ [${rupiah(
                        data[3]
                      )}] ~ Profit = ${rupiah(data[4])} ====>>> Sales: `}
                      <span style={{ color: "lightgreen" }}>
                        {`${data[5]}`}
                        <i
                          style={{
                            color: "lightgreen",
                            marginLeft: "0px",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            setChangeSalesView(!changeSalesView);
                            setSalesBefore(data[5]);
                            setOutletName(data[2]);
                            setSelectedTransactionSalesChange(data[6]);
                          }}
                        >
                          <CIcon
                            style={{ transform: "scale(0.7)" }}
                            icon={icon.cilPen}
                          />
                        </i>
                      </span>
                    </p>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <i style={{ color: "white" }}>
                        <CIcon icon={icon.cilClock} />
                      </i>
                      <p style={{ color: "#fff" }}>{data[1]} WITA</p>
                      <i
                        style={{ color: "red", cursor: "pointer" }}
                        onClick={() => handleHapusTransaksi(data[6])}
                      >
                        <CIcon icon={icon.cilTrash} />
                      </i>
                    </div>
                  </div>
                  <div className="itemOrders">
                    {data[0].map((item, i) => (
                      <div key={i} className="itemOrder">
                        <p>{item.itemName.toUpperCase()}</p>
                        <p>{`x ${item.quantity}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
