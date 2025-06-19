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
import {
  convertStringCaleToIndonesiaFormat,
  getIndonesianDay,
  parseIndonesianDate,
} from "../utils/indonesianDate";
import { handleExport } from "../utils/exportOrdersToExcel";
import {
  getCookie,
  setTagihanNotificationCookieUntilTomorrowStart,
} from "../utils/cookies";

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
  const [dataTagihan, setDataTagihan] = useState({
    tanggal: convertStringCaleToIndonesiaFormat(
      new Date(
        new Date().setDate(new Date().getDate() - 7)
      ).toLocaleDateString()
    ),
    ordersData: [],
  });
  const [isTagihanLoading, setIsTagihanLoading] = useState(true);
  const [outletTagihanName, setOutletTagihanName] = useState([]);
  const [validasiTagihanShow, setValidasiTagihanShow] = useState({});
  // const [tagihanList, setTagihanList] = useState({});
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
          // getTagihan7DayMore("0");
          getTagihan(false);
        }
      } catch (error) {
        console.error("Token decoding failed:", error);
      }
    }
  }, [token]);

  useEffect(() => {
    if (dataTagihan.ordersData) {
      setIsTagihanLoading(false);
    }
  }, [dataTagihan.ordersData]);

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

  const getTagihan = async (isFilteringDate) => {
    setIsTagihanLoading(true);
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BASEURL
        }/dashboard/tagihan/${parseIndonesianDate(
          dataTagihan.tanggal
        ).toISOString()}/${isFilteringDate ? "1" : "0"}`
      );
      console.log(response);

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
                if (error.response.status === 404) {
                  return {
                    itemName: "- dihapus / tidak tersedia -",
                    quantity,
                  };
                }
              }
            })
          );
          const convertedTime = dayjs
            .utc(order.createdAt)
            .tz(`Asia/Makassar`)
            .format(`HH:mm`);

          let name;
          try {
            const outlet = await axios.get(
              `${import.meta.env.VITE_BASEURL}/dashboard/orders/outlet/name/${
                order.outlet
              }`
            );
            // console.log(outlet)
            name = outlet.data.name;
          } catch (error) {
            console.log(error);
            if (error.response.status === 404) {
              name = "OUTLET TIDAK TERSEDIA / DIHAPUS";
            }
          }

          const profit = order.profit;
          const sales = order.sales;
          const keterangan = order.isBon ? "TEMPO" : "CASH";
          return [
            itemList,
            convertedTime,
            name,
            order.totalPayment,
            profit,
            sales,
            order.id,
            keterangan,
          ];
        })
      );

      setDataTagihan((prevData) => ({
        ...prevData,
        ordersData: ordersData,
      }));
    } catch (error) {
      if (error.response.status === 404) {
        setIsTagihanLoading(false);
      }
      setDataTagihan((prevData) => ({
        ...prevData,
        ordersData: [],
      }));
      console.log(error.response);
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
                    zIndex: "2",
                    position: "absolute",
                    marginTop: "10px",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
                    flexDirection: "column",
                    padding: "20px",
                    scrollPadding: "20px",
                    gap: "5px",
                    alignItems: "center",
                    overflowY: "auto",
                    display: listTagihanShow ? "flex" : "none",
                  }}
                  ref={listTagihanRef}
                >
                  <div >
                    <p style={{textAlign: "center"}}>TAGIHAN MINGGU LALU</p>

                  </div>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
                      borderRadius: "10px",
                      backgroundColor: "rgb(230, 243, 245)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        borderRadius: "10px",
                        backgroundColor: getCookie("TodayBillsExported") === "1" ? "lightgrey" : "#00B050",
                        cursor: "pointer",
                        // boxShadow:
                        //   validasiTagihanShow[idx] !== "flex"
                        //     ? "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px"
                        //     : "",
                        padding: "4px",
                      }}
                      onClick={async () =>
                        await handleExport({
                          ordersData: dataTagihan.ordersData,
                          isBillsData: true,
                          formattedDate: parseIndonesianDate(
                            dataTagihan.tanggal
                          ).toLocaleDateString(),
                          isUsingMsg: false,
                        })
                      }
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
                          }}
                        >
                          <h1
                            style={{
                              color: "#fff",
                              whiteSpace: "nowrap", // ⛔ Jangan bungkus ke baris baru
                              overflow: "hidden", // Sembunyikan kelebihan teks
                              textOverflow: "ellipsis", // Tampilkan "..." di ujung
                              maxWidth: "100%", // Batasi lebar maksimalnya
                            }}
                          >
                            {`Tagihan ${getIndonesianDay(
                              parseIndonesianDate(dataTagihan.tanggal).getDay()
                            )}, ${dataTagihan.tanggal}`}
                          </h1>
                          <h2
                            style={{
                              color: "blanchedalmond",
                              fontSize: "13px",
                            }}
                          >
                            {isTagihanLoading
                              ? "Loading..."
                              : `Total: ${rupiah(
                                  dataTagihan.ordersData.reduce(
                                    (acc, val) => acc + Number(val[3]),
                                    0
                                  )
                                )}`}
                          </h2>
                        </div>
                      </div>
                      <div
                        style={{
                          width: "15%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          flexDirection: "column",
                        }}
                      >
                        <h1
                          style={{
                            color: "lightgreen",
                            padding: "0px 7px",
                            borderRadius: "100%",
                            backgroundColor: "green",
                          }}
                        >
                          {isTagihanLoading
                            ? "..."
                            : `${dataTagihan.ordersData.length}`}
                        </h1>
                      </div>
                    </div>
                  </div>
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
                  // backgroundColor: "green",
                  backgroundColor:
                    getCookie("TodayBillsExported") === "1"
                      ? "transparent"
                      : "green",
                }}
              >
                {`${getCookie("TodayBillsExported") === "1" ? "" : "1"}`}
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
