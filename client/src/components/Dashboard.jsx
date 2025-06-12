import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import "../index.css";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import SpinnerLoader from "./SpinnerLoader";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/id";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
import { jwtDecode } from "jwt-decode";
import CIcon from "@coreui/icons-react";
import * as icon from "@coreui/icons";

const Dashboard = () => {
  const [product, setProduct] = useState("0");
  const [stock, setStock] = useState("0");
  const [todayOrders, setTodayOrders] = useState("0");
  const [todayIncomes, setTodayIncomes] = useState("0");
  const [chartData, setChartData] = useState([]);
  const [todayProfit, setTodayProfit] = useState("");
  const [todayBestSeler, setTodayBestSeller] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isNoLoggedIn, setIsNoLoggedIn] = useState(false);
  const [authCheck, setAuthCheck] = useState(true);
  const [listTagihanShow, setListTagihanShow] = useState(false);
  const [dataTagihan, setDataTagihan] = useState([]);
  const [jumlahDataTagihan, setJumlahDataTagihan] = useState(0);
  const [dataTagihanIsEnd, setDataTagihanIsEnd] = useState(false);
  const [outletTagihanName, setOutletTagihanName] = useState([]);
  const [validasiTagihanShow, setValidasiTagihanShow] = useState({});
  const [tagihanList, setTagihanList] = useState({});
  const navigate = useNavigate();

  const listTagihanRef = useRef(null);
  const iconListTagihan = useRef(null);

  const getLast7Days = () => {
    const days = [];
    const tz = "Asia/Makassar";

    for (let i = 1; i <= 7; i++) {
      const date = dayjs().tz(tz).subtract(i, "day");
      const formatted = date.format("dddd, D MMM"); // Hasil: "Kamis, 8 Mei"
      days.push(formatted);
    }

    return days.reverse();
  };

  const rupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  useEffect(() => {
    document.title = "AB FROZEN | Dashboard";
    refreshToken();
  }, []);

  useEffect(() => {
    function handleClickOutsideListTagihan(event) {
      if (iconListTagihan.current.contains(event.target)) {
        setListTagihanShow(!listTagihanShow);
      } else if (
        listTagihanRef.current &&
        !listTagihanRef.current.contains(event.target) &&
        !iconListTagihan.current.contains(event.target) &&
        listTagihanShow === true
      ) {
        setListTagihanShow(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutsideListTagihan);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideListTagihan);
    };
  }, [listTagihanShow]);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === "admin") {
          getProduct();
          getStock();
          getTodayOrders();
          getTodayIncomes();
          getLast6DaysIncomes();
          getTodayProfit();
          getTodayBestSellerProduct();
          getTagihan7DayMore("0");
        }
      } catch (error) {
        console.error("Token decoding failed:", error);
      }
    }
  }, [token]);

  useEffect(() => {
    async function fetchAllOutletNames() {
      const newOutletNames = [];

      for (let i = 0; i < dataTagihan.length; i++) {
        const outletId = dataTagihan[i].outlet;
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASEURL}/dashboard/outlet/${outletId}`
          );

          // console.log(response)
          newOutletNames.push({
            name: response.data.name,
            address: response.data.address,
            index: i,
          });
        } catch (error) {
          if (error.response.status === 404) {
            newOutletNames.push({
              name: "OUTLET TIDAK TERSEDIA",
              address: "DIHAPUS",
              index: i,
            });
          }
          console.error(error);
        }
      }

      setOutletTagihanName(newOutletNames); // ✅ hanya sekali setState
    }

    if (dataTagihan.length > 0) {
      fetchAllOutletNames();
    }
  }, [dataTagihan]);

  useEffect(() => {
    const fetchTagihanBills = async () => {
      for (let item of dataTagihan) {
        // console.log(`item ID = ${item.id}`);
        // ✅ Skip jika data tagihan untuk item.id sudah ada
        if (tagihanList[item.id]) continue;

        try {
          const res = await axios.get(
            `${import.meta.env.VITE_BASEURL}/dashboard/tagihan7hari/bills/${
              item.id
            }`
          );
          // console.log(res);
          setTagihanList((prev) => ({
            ...prev,
            [item.id]: res.data.bills,
          }));
        } catch (err) {
          setTagihanList((prev) => ({
            ...prev,
            [item.id]: "Gagal memuat",
          }));
        }
      }
    };

    if (dataTagihan.length > 0) {
      fetchTagihanBills();
    }

    // console.log(tagihanList);
  }, [dataTagihan, tagihanList]);

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
      setUserRole(decoded.role);
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

  if (isNoLoggedIn || !userRole) {
    return null;
  }

  const getProduct = async () => {
    try {
      const response = await axiosJWT.get(
        `${import.meta.env.VITE_BASEURL}/dashboard/items`
      );
      // console.log(response.data)
      setProduct(response.data.total_product);
    } catch (error) {
      console.log(error.response);
    }
  };

  const getStock = async () => {
    try {
      const response = await axiosJWT.get(
        `${import.meta.env.VITE_BASEURL}/dashboard/stock`
      );
      setStock(response.data.total_stock);
    } catch (error) {
      console.log(error.response);
    }
  };

  const getTodayOrders = async () => {
    try {
      const response = await axiosJWT.get(
        `${import.meta.env.VITE_BASEURL}/dashboard/todayOrders`
      );
      setTodayOrders(response.data.total_today_orders);
    } catch (error) {
      console.log(error.response);
    }
  };

  const getTodayIncomes = async () => {
    try {
      const response = await axiosJWT.get(
        `${import.meta.env.VITE_BASEURL}/dashboard/todayIncome`
      );
      setTodayIncomes(rupiah(response.data.total_today_income));
    } catch (error) {
      console.log(error.response);
    }
  };

  const getLast6DaysIncomes = async () => {
    try {
      const response = await axiosJWT.get(
        `${import.meta.env.VITE_BASEURL}/dashboard/last6DaysIncome`
      );
      setChartData(response.data.incomes);
    } catch (error) {
      console.log(error.response);
    }
  };

  const getTodayProfit = async () => {
    try {
      const response = await axiosJWT.get(
        `${import.meta.env.VITE_BASEURL}/dashboard/todayProfit`
      );
      setTodayProfit(response.data.profit);
    } catch (error) {
      console.log(error.response);
    }
  };

  const getTodayBestSellerProduct = async () => {
    try {
      const response = await axiosJWT.get(
        `${import.meta.env.VITE_BASEURL}/dashboard/todayBestSeller`
      );
      setTodayBestSeller(response.data.item.toUpperCase());
    } catch (error) {
      console.log(error.response);
    }
  };

  const getTagihan7DayMore = async (isMore) => {
    // const isMore = dataTagihan.length > 2 ? true : false
    const latestDateShowed = dataTagihan.length
      ? dataTagihan[dataTagihan.length - 1].createdAt
      : "-";
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BASEURL
        }/dashboard/tagihan7hari/${isMore}/${latestDateShowed}`
      );

      // console.log(response.data);
      setJumlahDataTagihan(response.data.manyOfTransaction);
      setDataTagihan((prevData) => [...prevData, ...response.data.transaction]);

      if (response.data.isEnd === "1") {
        setDataTagihanIsEnd(true);
      }

      // console.log(dataTagihan, response.data.isEnd);
    } catch (error) {
      console.log(error.response);
    }
  };

  const handleLoadTagihan = async (orderId, billIndex) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BASEURL
        }/dashboard/tagihan7hari/bills/${orderId}/${billIndex}`
      );
      // console.log(response);
      return response.data.msg;
    } catch (error) {
      console.error(error.response);
    }
  };

  const data = {
    labels: getLast7Days(),
    datasets: [
      {
        label: "Last 7 days Incomes",
        data: chartData,
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(255, 159, 64, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      x: {
        ticks: {
          font: {
            size: 8, // Ukuran font label sumbu X
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 10, // Ukuran font label sumbu Y
          },
          beginAtZero: true,
        },
      },
    },
  };

  const convertTanggal = (date) => {
    const converedTime = dayjs
      .utc(date)
      .tz(`Asia/Makassar`)
      .format(`dddd, DD MMMM YYYY`);
    return converedTime;
  };

  const hitungSudahBerapaHari = (date) => {
    const waktuTransaksi = dayjs
      .utc(date)
      .tz("Asia/Makassar")
      .format(`YYYY-MM-DD`);
    const udahBerapaLama = dayjs().diff(waktuTransaksi, "day");
    return udahBerapaLama;
  };

  const handleShowValidLunas = async (index) => {
    setValidasiTagihanShow((prevValid) => {
      if (!prevValid[index] || prevValid[index] === "none") {
        return {
          ...prevValid,
          [index]: "flex",
        };
      }
      return {
        ...prevValid,
        [index]: "none",
      };
    });

    // console.log(validasiTagihanShow);
  };

  const handleLunasinTagihan = async (orderId) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASEURL}/dashboard/tagihan7hari`,
        {
          orderId: orderId,
        }
      );

      if (response) {
        // console.log("hapus");
        setDataTagihan((prevData) => {
          return prevData.filter((data) => data.id !== orderId);
        });
        setJumlahDataTagihan(jumlahDataTagihan - 1);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // console.log(dataTagihan)

  // CSS styling
  const myHeroStyle = {
    display: "block",
    position: "relative",
  };
  const myDashboardTextStyle = {
    fontSize: "70px",
    fontWeight: "bold",
    color: "black",
    borderLeft: "10px solid darkorange",
    paddingLeft: "10px",
    marginTop: "3px",
  };
  const judulStyle = {
    position: "absolute",
    marginLeft: "-0px",
    marginTop: "-200px",
    fontWeight: "bold",
    color: "black",
    borderBottom: "3px solid lightgrey",
    paddingRight: "34%",
  };
  const incomeStyle = {
    backgroundColor: "darkorange",
  };
  const incomeTextStyle = {
    color: "white",
  };

  return (
    <div className="is-flex">
      <Sidebar role={userRole} />

      <div className="my-dashboard">
        <div className="my-dashboardChild">
          <div style={myHeroStyle} className="my-headMenu">
            <h1 style={myDashboardTextStyle}>Dashboard</h1>
            <div style={{ position: "absolute", left: "450px", top: "50px" }}>
              <div style={{ position: "absolute" }}>
                <i
                  ref={iconListTagihan}
                  style={{ color: "black", cursor: "pointer" }}
                >
                  <CIcon icon={icon.cilNotes} />
                </i>
                <div
                  className="scrollable"
                  style={{
                    width: "350px",
                    height: "500px",
                    zIndex: "2",
                    position: "absolute",
                    marginTop: "10px",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
                    flexDirection: "column",
                    padding: "20px",
                    scrollPadding: "20px",
                    gap: "20px",
                    alignItems: "center",
                    overflowY: "auto",
                    display: listTagihanShow ? "flex" : "none",
                  }}
                  ref={listTagihanRef}
                >
                  {/* raw */}
                  {dataTagihan.map((data, idx) => {
                    const outlet = outletTagihanName.find(
                      (otl) => otl.index === idx
                    );

                    return (
                      <div
                        style={{
                          width: "100%",
                          // minHeight: "80px",
                          // maxHeight: "80px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          boxShadow:
                            validasiTagihanShow[idx] === "flex"
                              ? "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px"
                              : "",
                          borderRadius: "10px",
                          backgroundColor:
                            validasiTagihanShow[idx] === "flex"
                              ? "rgb(230, 243, 245)"
                              : "white",
                        }}
                      >
                        <div
                          key={idx}
                          style={{
                            width: "100%",
                            minHeight: "80px",
                            maxHeight: "80px",
                            display: "flex",
                            borderRadius: "10px",
                            backgroundColor:
                              validasiTagihanShow[idx] === "flex"
                                ? "rgb(230, 243, 245)"
                                : "white",
                            cursor: "pointer",
                            boxShadow:
                              validasiTagihanShow[idx] !== "flex"
                                ? "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px"
                                : "",
                            padding: "4px",
                          }}
                          onClick={() => handleShowValidLunas(idx)}
                        >
                          <div
                            style={{
                              width: "85%",
                              padding: "5px",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                height: "75%",
                                borderBottom: "1px solid lightgrey",
                              }}
                            >
                              <h1
                                style={{
                                  color: "silver",
                                  whiteSpace: "nowrap", // ⛔ Jangan bungkus ke baris baru
                                  overflow: "hidden", // Sembunyikan kelebihan teks
                                  textOverflow: "ellipsis", // Tampilkan "..." di ujung
                                  maxWidth: "100%", // Batasi lebar maksimalnya
                                }}
                              >
                                {outlet
                                  ? `${outlet.name.toUpperCase()} - ${outlet.address.toUpperCase()}`
                                  : "Loading..."}
                              </h1>
                              <h2 style={{ color: "salmon", fontSize: "13px" }}>
                                {rupiah(data.totalPayment)}
                              </h2>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                height: "25%",
                                display: "flex",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "11px",
                                  marginTop: "2px",
                                  color: "grey",
                                }}
                              >
                                {convertTanggal(data.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div
                            style={{
                              width: "15%",
                              // backgroundColor: "red",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexDirection: "column",
                            }}
                          >
                            <h1 style={{ color: "darkorange" }}>
                              {hitungSudahBerapaHari(data.createdAt)}
                              <span style={{ fontSize: "10px" }}>hr</span>
                            </h1>
                            <i
                              style={{
                                color:
                                  validasiTagihanShow[idx] !== "flex"
                                    ? "green"
                                    : "red",
                              }}
                            >
                              <CIcon
                                icon={
                                  validasiTagihanShow[idx] !== "flex"
                                    ? icon.cilCheckAlt
                                    : icon.cilLevelUp
                                }
                              />
                            </i>
                          </div>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            // height: "70px",
                            backgroundColor:
                              validasiTagihanShow[idx] === "flex"
                                ? "rgb(230, 243, 245)"
                                : "white",
                            display: validasiTagihanShow[idx] || "none",
                            padding: "10px",
                            paddingBottom: "20px",
                            justifyContent: "center",
                            alignItems: "center",
                            flexDirection: "column",
                            borderRadius: "10px",
                          }}
                        >
                          {/* <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <p
                              style={{ fontSize: "12px", color: "darkorange" }}
                            >
                              Lunaskan tagihan?
                            </p>
                            <i
                              style={{
                                color: "darkorange",
                                transform: "scale(0.7)",
                              }}
                            >
                              <CIcon icon={icon.cilWarning} />
                            </i>
                          </div>
                          <div
                            className="pemilihan-lunas"
                            style={{
                              padding: "5px",
                              display: "flex",
                              gap: "5px",
                            }}
                          >
                            <button
                              className="button"
                              style={{
                                fontSize: "12px",
                                border: "none",
                                backgroundColor: "green",
                              }}
                              onClick={() => handleLunasinTagihan(data.id)}
                            >
                              Lunaskan
                            </button>
                            <button
                              className="button"
                              style={{
                                fontSize: "12px",
                                border: "none",
                                backgroundColor: "red",
                              }}
                              onClick={() => {
                                setValidasiTagihanShow((prevValid) => {
                                  if (prevValid[idx]) {
                                    return {
                                      ...prevValid,
                                      [idx]: "none",
                                    };
                                  }
                                });
                              }}
                            >
                              Tidak
                            </button>
                          </div> */}

                          <div
                            style={{
                              width: "100%",
                              display: "flex",
                              gap: "10px",
                              flexDirection: "column",
                            }}
                          >
                            {[1, 2, 3, 4].map((i) => {
                              const setorKey = `setor${i}`;
                              const value = tagihanList[data.id]?.[setorKey];

                              return (
                                <div
                                  key={i}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "12px",
                                  }}
                                >
                                  <p>Setoran ke {i}:</p>
                                  <p>
                                    {!tagihanList[data.id]
                                      ? "Loading..."
                                      : value
                                      ? rupiah(value)
                                      : "-"}
                                  </p>
                                </div>
                              );
                            })}

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "12px",
                              }}
                            >
                              <p>Sisa Tagihan:</p>
                              <p>
                                {!tagihanList[data.id]
                                  ? "Loading..."
                                  : rupiah(
                                      data.totalPayment -
                                        [1, 2, 3, 4].reduce(
                                          (sum, i) =>
                                            sum +
                                            (tagihanList[data.id]?.[
                                              `setor${i}`
                                            ] || 0),
                                          0
                                        )
                                    )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* end raw */}

                  <p
                    style={{
                      cursor: !dataTagihanIsEnd ? "pointer" : "",
                      color: dataTagihanIsEnd ? "silver" : "lightgreen",
                      fontSize: "12px",
                    }}
                    onClick={(e) => {
                      if (dataTagihanIsEnd) return;
                      e.stopPropagation();
                      getTagihan7DayMore("1");
                    }}
                  >
                    {dataTagihanIsEnd
                      ? "Tidak ada data untuk ditampilkan lagi"
                      : "Muat lebih banyak"}
                  </p>
                </div>
              </div>
              <p
                style={{
                  position: "relative",
                  pointerEvents: "none",
                  top: "5px",
                  left: "17px",
                  color: "white",
                  padding: "3px 7px 3px 7px",
                  fontSize: "12px",
                  textAlign: "center",
                  borderRadius: "50%",
                  backgroundColor: "red",
                }}
              >
                {jumlahDataTagihan}
              </p>
            </div>
          </div>
          <div className="my-headMenu">
            <div className="chartContainer">
              <Bar className="chartView" data={data} options={options} />
            </div>
          </div>
        </div>
        <div className="my-dashboardChild">
          <div className="my-headMenu">
            <h1 style={judulStyle}>Product</h1>
            <div className="my-menu">
              <h3>Total Of Product</h3>
              <h1>{product}</h1>
            </div>
            <div className="my-menu">
              <h3>Total Of Stock</h3>
              <h1>{stock}</h1>
            </div>
          </div>
          <div className="my-headMenu">
            <h1 style={judulStyle}>Incomes</h1>
            <div
              style={{ cursor: "pointer", backgroundColor: "darkorange" }}
              className="my-menu"
              onClick={function () {
                navigate("/orders");
              }}
            >
              <h3>Today Orders</h3>

              <h1 style={incomeTextStyle}>{todayOrders}</h1>
            </div>
            <div style={incomeStyle} className="my-menu">
              <h3>Today Incomes</h3>

              <h1 style={incomeTextStyle}>{todayIncomes}</h1>
            </div>
          </div>
        </div>
        <div className="my-dashboardChild">
          <div className="my-headMenu">
            <div className="my-menu">
              <h3>Today Best Seller</h3>
              <div style={{ width: "600px" }}>
                <h1
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {todayBestSeler || "-"}
                </h1>
              </div>
            </div>
          </div>
          <div className="my-headMenu">
            <div className="my-menu" style={{ backgroundColor: "darkorange" }}>
              <h3>Today Profit</h3>
              <h1 style={{ color: "white" }}>{rupiah(todayProfit) || "-"}</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
