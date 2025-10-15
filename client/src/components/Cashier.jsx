import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import axios from "axios";
import "../index.css";
import qz from "qz-tray";
import { jwtDecode } from "jwt-decode";
import SpinnerLoader from "./SpinnerLoader";
import { useNavigate } from "react-router-dom";
import CIcon from "@coreui/icons-react";
import * as icon from "@coreui/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/id";
import rupiah from "../utils/rupiah.js";

import backgroundKu from "../assets/img/form2.jpg";
import handleFunLoading from "../utils/handleFunLoading.js";
import cP from "../utils/ckPay.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

const Cashier = () => {
  const hasTokenMountRef = useRef(false)
  const [msg, setMsg] = useState(null);
  const [recordCode, setRecordCode] = useState("");
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState("");
  const [cash, setCash] = useState("");
  const [isBon, setIsBon] = useState(false);
  const [returns, setReturns] = useState("_____________");
  const [discount, setDiscount] = useState("_____________");
  const [outlet, setOutlet] = useState({ id: null, name: "" });
  const [formattedCash, setFormattedCash] = useState("");
  const [productList, setProductList] = useState([]); // S tate untuk daftar produk hasil pencarian
  const [showDropdownProductCode, setShowDropdownProductCode] = useState(false); // State untuk menampilkan dropdown
  const [outletList, setOutletList] = useState([]); // S tate untuk daftar produk hasil pencarian
  const [showDropdownOutlet, setShowDropdownOutlet] = useState(false); // State untuk menampilkan dropdown
  const [isStoreClicked, setIsStoreClicked] = useState(false); // State untuk tombol Store
  const [previousPrice, setPreviousPrice] = useState({});
  // const [waitOutletSearch, setWaitOutletSearch] = useState(true)
  const [sales, setSales] = useState("Ana");

  //jika menggunakan cash tanpa input manual (otomatis)
  //akan mengeset cash di store orders dengan nilai "cashTanpaInput"
  const [cashTanpaInput, setCashTanpaInput] = useState(0);

  //jika is Dus dan pack checked
  const [isUnitChecked, setIsUnitChecked] = useState(false);
  const [isPackChecked, setIsPackChecked] = useState(false);

  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isNoLoggedIn, setIsNoLoggedIn] = useState(false);
  const [authCheck, setAuthCheck] = useState(true);

  //state untuk menyimpan cache data printan
  const [printData, setPrintData] = useState({
    datas: null,
    transCode: null,
    from: null, //ini digunakan untuk validasi saat membuat receipt
    isBonFromAdmin: null,
    outletName: null,
  });

  const [requestPrintDataFromAdmin, setRequestPrintDataFromAdmin] = useState(
    []
  );

  const [isCreateOrderClicked, setIsCreateOrderClicked] = useState(false)

  const [outletSearching, setOutletSearching] = useState([]);
  const [refreshLoadingAdminRequest, setRefreshLoadingAdminRequest] =
    useState(false);

  const [isContainerLoading, setIsContainerLoading] = useState(true);

  const [isRecordsLoading, setIsRecordsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    //mengecek printer

    // qz.websocket.connect().then(() => {
    //   return qz.printers.find();
    // }).then(printers => {
    //   console.log("Printers Available: ", printers);
    // }).catch(err => console.error(err));

    //punya bik ana TOSHIBA
    qz.security.setCertificatePromise(function (resolve, reject) {
      resolve(
        "-----BEGIN CERTIFICATE-----\nMIIECzCCAvOgAwIBAgIGAZdsEAi2MA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQGEwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwSUVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxHDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkgRGVtbyBDZXJ0MB4XDTI1MDYxMzAxMzExOVoXDTQ1MDYxMzAxMzExOVowgaIxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYDVQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVogVHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDkc9U77w58/nG70P8e3D85zJp/W7VMTf5ULhK4cORQwWDMbuqlZ51sfyge55liW5zRgtmZoSxoLmTC3LiT6lOB5URivHiHB6PJo3tslqT+BExscnM++j397sRD6+wT8kI6ml0POsgTco2Rjuglx9ZyuoOE4MzWzy5CSVOmC15qCexWWM4gbPInuf/wYARjb+psU1C3uBfsdvFwQ02xDtSHa3bpCtje6IDLSMJouGyGRDAbKonh7glPO0q6Wm7z9irwTgzVl7bjGjiSO6+/2U+b9m7MxccwigxDh9DTfpOvfD55p5mxNcxY4+9y1kt7ENSMovwM2ziPwqZx2C+wWNZZAgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBR/rZ/ORgxwCtMABCd2omYY9wHMiTANBgkqhkiG9w0BAQsFAAOCAQEAITAUmOOLbtLFfLBKSJZtVB/UsZZF+5n1yefK8xGxZ8XCNEGYfIzPDitactWdn2Ub75RDvk423cBbxPxMInnOeo0ePH6MTj7Vp7A4RT2ql985a+iQyYARuLHNs6WaAMdOeL9d01+occb5x9iTryDeWVJzOdmNgINeBHnwRoM9L2YlCL6zFArGC6Fwq+JBTGHekUZ7/rcO4yQQM/3GpNuQL30eL3+F1arG+bP1xDQjnDJc1GcC/K0XxsNUEQF8V8sMLDtmqsVTFy6oqQeG1EcAeNKU/dYPmjD7R4VpH96IaZEB0g/LW0fdUo0X8W9s2Rj3rHmFpLiDw4X1daVpekHqUQ==\n-----END CERTIFICATE-----\n"
      );
    });
    
    //punya bik ana AXIIOO
    // qz.security.setCertificatePromise(function (resolve, reject) {
    //   resolve(
    //         "-----BEGIN CERTIFICATE-----\nMIIECzCCAvOgAwIBAgIGAZfUDsvXMA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQGEwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwSUVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxHDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkgRGVtbyBDZXJ0MB4XDTI1MDcwMzA2MTAyOFoXDTQ1MDcwMzA2MTAyOFowgaIxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYDVQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVogVHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7IDujbu/MA3/TqtyXi8MK5p6CVbXEmPj3QFD2SfTGHRyJecAZxTf88B894aTYDt6bnpHAauyKyMpaFAHk5O5LCgkTnlYjgK4y3H0kCpTb20ESkJh6vrnaAze+vYJS2lR9t3Y0iaqrXZ6NJInUggGMTdLKsIpi+RWY5uXV4t+Dj+prS5IFWIZX7sDURA4S4647r2ghuwqdxwy6XHPDVILKAssdDDjv3jtjtZUvoycjDsdDyEZ9vKgCUcDI0fCcTr1Y/yvQ9ewmATd5Hz3FJZSRgR81DmDrV3pgmMs5K32iCY8Lwl6kx/7XOJ6zPc7j6/3UHt0Y8SxoSuJLJF4Uy7eDAgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBT82+5scSlL/EI37MZd7uUvYEmDtjANBgkqhkiG9w0BAQsFAAOCAQEAAXq+BRU+1CnJ5shMhEfxW58drhA4/bEDeUmQRlpXN2Uey2FSdTwq32JU5BmpsZMDD0WzMPUhkJc6NAuuBusWJGrmahMsEoI0bg4OwQb/WFr2SIosuoi7HxKA+vDComdWeMHoHTvZMhpie9nZKi8QjOsdrAkCnSiI7hzjREiw7uHMCw0cUoRDmzmRSlfFd74ee66Q+5OUdxXei+sVKmF1U1rMj3Xi8h/oZDx++n6jU8JmDlbLem/hS7s02ZaSEgLqk8bb0KDqJH4LJtyegf5l+IYOrAjmTwdYdzlIuVCAcIyySAhNYXb7d6b9mPTfYXzcondTI89PSs9yVqP/VpBTLA==\n-----END CERTIFICATE-----\n"
    //   );
    // });

    //punya bayu
    // qz.security.setCertificatePromise(function (resolve, reject) {
    //   resolve(
    //     "-----BEGIN CERTIFICATE-----\nMIIECzCCAvOgAwIBAgIGAZF0jXCaMA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQGEwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwSUVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxHDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkgRGVtbyBDZXJ0MB4XDTI0MDgyMDEwNDgzMloXDTQ0MDgyMDEwNDgzMlowgaIxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYDVQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVogVHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDRLFVosBSOp+5Z4txzMzA6+M+bIooM6eoePWLKATbScFJlS/LqVlLJ/j9RdAsu8AB0055RHD9cA7OHg2qzt1E3PWq0tLaObe5gxS7pO7dlN7FkkQfAEWS9FaTL0N9ZXPnzMAQFB3iAjnEjnldGCgCtPoeQY5COpiElDNtUTB7Hm1EOr/2/N/G3bt6Plc8A+Vk9fffSKyW5xn+kNO9gQMwi8pbdB08jS3HeblnVz0SKUuEPtq46YyZ5cN0KA8n2dgSjuBmpeFm3w+TfrTm0tchqSBWhP3WjyxOMbbJwfYOyrPMtsTDS08qLizOts2hK57DzXAikVNcF96/pcS2NIXXJAgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBSO/7SedSDuNS0aIJrl2O5XtudE1DANBgkqhkiG9w0BAQsFAAOCAQEAw3pyxfBeErqwNLr1xIW+T2NJ4YhrSZl9NpVjaS7oZ6YHDc3GiZq17gNGFtCmGQlCSCDHDesNAG7jtYACV2T49EKPqEvWxLw8/jr8Y3ggiCRqgLo56SKDWSEhzZmXGia6CVHK5yjKY7ca8njy7pWiT7k3ZyBqNMNd/+KL/8ckTTt4ZYQ1JT3rGYLfL+j1ksV7JGY/wCAu4cf/+0LsBFbamJMGmAzfQikir2PniWsMZ31WM3GiSOP92/TZNa8qtrU9NhvWyGP0emPly0jG1mvFoUXSYTkEEjEhnPne+BnPi+KAwM2TgoiH2z7ejdp+NyX+v2SlB7P0nwSYieWGilcA3A==\n-----END CERTIFICATE-----\n"
    //   );
    // });

    qz.api.setSha256Type((data) => {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
    });

    qz.api.setPromiseType((resolver) => {
      return new Promise(resolver);
    });

    if (!qz.websocket.isActive()) {
      qz.websocket.connect().catch((err) => console.error(err));
    }

    if (printData.datas && printData.transCode) {
      createRecipt(
        printData.datas,
        printData.transCode,
        printData.from,
        printData.isBonFromAdmin,
        printData.outletName
      );
    }
  }, [printData]);

  useEffect(() => {
    document.title = "AB FROZEN | Cashier";
    refreshToken();
  }, []);

  useEffect(() => {
    if (recordCode && records.length === 0) {
      getRecords();
    }
  }, [recordCode, records]);

  useEffect(() => {
    if (token && !hasTokenMountRef.current) {
      try {
        if (token && !recordCode && userRole) {
          getTurnCode();
        } else if (token && userRole === "kasir") {
          getRequestPrintFromAdmin(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsContainerLoading(false);
      }

      hasTokenMountRef.current = true
    }
  }, [token, recordCode, userRole]);

  const refreshToken = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASEURL}/token`,
        {
          withCredentials: true,
        }
      );

      const decoded = jwtDecode(response.data.accessToken);

      // console.log(decoded.role)

      // if(decoded.role !== "kasir" && decoded.role === "admin") {
      //   navigate("/")
      // }

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

  useEffect(() => {
    async function fetchAllOutletNames() {
      for (let i = 0; i < requestPrintDataFromAdmin.length; i++) {
        const outletId = requestPrintDataFromAdmin[i].outlet;
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASEURL}/dashboard/outlet/${outletId}`
          );

          setOutletSearching((prev) => [
            ...prev,
            {
              name: response.data.name,
              address: response.data.address,
              index: i,
              outletId: outletId,
            },
          ]);
        } catch (error) {
          console.error(error);
        }
      }
    }

    if (requestPrintDataFromAdmin.length > 0) {
      fetchAllOutletNames();
    }
  }, [requestPrintDataFromAdmin]);

  useEffect(() => {
    if (userRole) {
      console.log(userRole);
    }
  }, [userRole]);

  // const axiosJWT = axios.create();
  // axiosJWT.interceptors.request.use(async (config) => {
  //     const currentDate = new Date();
  //     if (expire * 1000 < currentDate.getTime()) {
  //         const response = await axios.get(`${import.meta.env.VITE_BASEURL}/token`);
  //         config.headers.Authorization = `Bearer ${response.data.accessToken}`;
  //         setToken(response.data.accessToken);
  //         const decoded = jwtDecode(response.data.accessToken);
  //         setExpire(decoded.exp);
  //     }
  //     return config;
  // }, (error) => {
  //     return Promise.reject(error);
  // });

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

  const convertTanggal = (date) => {
    const converedTime = dayjs.utc(date).tz(`Asia/Makassar`).format(`HH:mm`);
    return converedTime;
  };

  const getTurnCode = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASEURL}/record/code`
      );
      setRecordCode(response.data.turn_code);
    } catch (error) {
      console.log(error);
      setMsg({ msg: error.response.data.msg, color: "red" });
    }
  };

  const getRequestPrintFromAdmin = async (isFirstLoad, dataId, dataIndex) => {
    console.log(`isFirstLoad: ${isFirstLoad}`);
    console.log(`dataId: ${dataId}`);
    console.log(dataId);
    // console.log(`dataName: ${dataName}`)
    console.log(outletSearching);
    if (isFirstLoad) {
      try {
        setRefreshLoadingAdminRequest(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BASEURL}/orders/adminRequest`
        );
        // console.log(response.data);
        setRequestPrintDataFromAdmin(response.data);

        setRefreshLoadingAdminRequest(false);
      } catch (error) {
        console.log(error);
        setRefreshLoadingAdminRequest(false);
      }
    } else {
      setRequestPrintDataFromAdmin((prevData) =>
        prevData.filter((data) => data.id !== dataId)
      );

      setOutletSearching((prevData) =>
        prevData.filter(
          (data) => data.outletId != dataId && data.index != dataIndex
        )
      );
    }
  };

  const record = async (e) => {
    e.preventDefault();
    try {
      const selectedProduct = productList.find(
        (key) => key.code === productCode
      );
      // console.log(selectedProduct);
      // const realQuantity = isUnitChecked ? parseInt(quantity) * parseInt(selectedProduct.unitTotal) : quantity
      let realQuantity;

      if (isUnitChecked) {
        realQuantity = parseInt(quantity) * parseInt(selectedProduct.unitTotal);
      } else if (isPackChecked) {
        realQuantity =
          parseInt(quantity) * parseInt(selectedProduct.unitTotalPack);
      } else {
        realQuantity = quantity;
      }

      // const oneOrNull = isUnitChecked ? `1-${selectedProduct.unitTotal * quantity}-${selectedProduct.unitTotal}` : "0"
      let oneOrNull;
      if (isUnitChecked) {
        oneOrNull = `1-${selectedProduct.unitTotal * quantity}-${
          selectedProduct.unitTotal
        }`;
      } else if (isPackChecked) {
        oneOrNull = `2-${selectedProduct.unitTotalPack * quantity}-${
          selectedProduct.unitTotalPack
        }`;
      } else {
        oneOrNull = "0";
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BASEURL}/record`,
        {
          turnCode: recordCode,
          itemCode: productCode,
          quantity: realQuantity,
          isUnitChecked: oneOrNull,
        }
      );
      if (response) {
        setProductCode("");
        setProductName("");
        setQuantity("");
        await getRecords();
      }
    } catch (error) {
      if (error.response) {
        console.log(error.response.data.msg);
        setMsg({ msg: error.response.data.msg, color: "red" });
      }
    }
  };

  const getRecords = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASEURL}/record/turncode/${recordCode}`
      );
      setRecords(response.data.data);
      // console.log(records);
      if (response) {
        let price = [];
        const items = response.data.data;
        // console.log(items)
        items.forEach((item) => {
          price.push(item.finalPrice);
        });
        const totalPrice = price.reduce((acc, val) => acc + val, 0);
        setCashTanpaInput(totalPrice);
        setTotal(rupiah(totalPrice));
      }
    } catch (error) {
      console.log(error);
      setMsg({ msg: error.response.data.msg, color: "red" });
    }
  };

  const sendOrdersToKasir = async (e) => {
    e.preventDefault();

    if (isStoreClicked) return;

    setIsCreateOrderClicked(true)

    const totalProfit = records.reduce((acc, val) => acc + val.profit, 0);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASEURL}/orders`,
        {
          turnCode: recordCode,
          cash: cashTanpaInput,
          profit: totalProfit,
          outlet: outlet.id,
          sales: sales,
          isBon: isBon,
          author: userRole,
        }
      );
      if (response) {
        setReturns(rupiah(response.data.data.cashReturn));
        setDiscount(rupiah(response.data.data.sumDiscount));
        setMsg({ msg: response.data.msg, color: "green" });
        setIsStoreClicked(true);

        //menyimpan state cache [printan]
        // setPrintData({
        //   datas: response.data.recipt,
        //   transCode: response.data.data.transCode,
        // });

        //membuat recipt
        // createRecipt(response.data.recipt, response.data.data.transCode, response.data.unitTotal)
      }
    } catch (error) {
      console.log(error.response);
      setMsg({ msg: error.response.data.msg, color: "red" });
      setIsCreateOrderClicked(false)
      setIsStoreClicked(false);
    }
  };

  const handleQuantityArrowOnClick = async (isLeft, recordId) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASEURL}/record/quantity`,
        {
          isLeft: isLeft,
          id: recordId,
          turnCode: recordCode,
        }
      );

      if (response) {
        await getRecords();
      }
    } catch (error) {
      setMsg({ msg: error.response.data.msg, color: "red" });
      console.error(error.response);
    }
  };

  const storeOrders = async (e) => {
    e.preventDefault();

    if (isStoreClicked) return;

    setIsCreateOrderClicked(true)

    const totalProfit = records.reduce((acc, val) => acc + val.profit, 0);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASEURL}/orders`,
        {
          turnCode: recordCode,
          cash: cashTanpaInput,
          profit: totalProfit,
          outlet: outlet.id,
          sales: sales,
          isBon: isBon,
          author: userRole,
        }
      );

      if (response) {
        setReturns(rupiah(response.data.data.cashReturn));
        setDiscount(rupiah(response.data.data.sumDiscount));
        setMsg({ msg: response.data.msg, color: "green" });
        setIsStoreClicked(true);

        //menyimpan state cache [printan]
        setPrintData({
          datas: response.data.recipt,
          transCode: response.data.data.transCode,
          from: "kasir",
          isBonFromAdmin: null,
          outletName: null,
        });

        //membuat recipt
        // createRecipt(response.data.recipt, response.data.data.transCode, response.data.unitTotal)
      }
    } catch (error) {
      console.log(error.response);
      setMsg({ msg: error.response.data.msg, color: "red" });
      setIsStoreClicked(false);
    }
  };

  const createRecipt = async (
    datas,
    transCode,
    author,
    isBonFromAdmin,
    outletNameFromAdmin
  ) => {
    // datas.forEach(data => {
    //     console.log(`${data.itemName} : ${data.finalPrice}`)
    // })
    console.log(datas);
    console.log(isBonFromAdmin);
    const config = qz.configs.create(
      // "Microsoft Print to PDF",
      "108Label Printer",
      {
        size: { width: 100, height: 150 },
        units: "mm",
        orientation: "portrait",
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
      }
    );

    const day = new Date().getDay();
    const indonesianDay = {
      1: "Senin",
      2: "Selasa",
      3: "Rabu",
      4: "Kamis",
      5: "Jumat",
      6: "Sabtu",
      0: "Minggu",
    };
    const date = String(new Date().getDate()).padStart(2, "0");
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const year = new Date().getFullYear();
    const hours = String(new Date().getHours()).padStart(2, "0");
    const minute = String(new Date().getMinutes()).padStart(2, "0");
    const totalKeseluruhan = datas.reduce(
      (acc, val) => acc + val.finalPrice,
      0
    );

    let fixedIsBon, fixedOutlet;

    author === "admin" ? (fixedIsBon = isBonFromAdmin) : (fixedIsBon = isBon);
    author === "admin"
      ? (fixedOutlet = outletNameFromAdmin)
      : (fixedOutlet = outlet.name);

    const hutang = fixedIsBon ? "TEMPO" : "CASH";
    // const abLogo = "data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8/+3BAQkAAACAoP+v2xGoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC8BFN+dC4W5EPwAAAAASUVORK5CYII="
    // const abLogo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAAUACAYAAAAY5P/3AAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAACAASURBVHic7N13lKUJXef/d1V1mMwMMOScRrIERZIKKgbMurrqmlZdMawuJnRXf/50/Z01I2IWRVFBXfOuAVkVBV2CikgSBCRKnhlmmJ6e6fT741t1umfs6QldVfdW9et1znO6p7u679PPvbfmqU99QwEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACw5vx/egy3ndTuj9oAAAAASUVORK5CYII="
    const abLogo =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAAUACAYAAAAY5P/3AAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAACAASURBVHic7N13lKUJXef/d1V1mMwMMOScRrIERZIKKgbMurrqmlZdMawuJnRXf/50/Z01I2IWRVFBXfOuAVkVBV2CikgSBCRKnhlmmJ6e6fT741t1umfs6QldVfdW9et1znO6p7u679PPvbfmqU99QwEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACw5vx/egy3ndTuj9oAAAAASUVORK5CYII=";

    const data = [
      {
        type: "html",
        format: "plain",
        data: `
            <div style="font-family: Arial, sans-serif; font-size: 10px; width: 100%; display: flex; justify-content: center; flex-direction: column;">
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center">
                    <img src=${abLogo} alt="Logo" style="max-width: 100px;"/>
                    <div style="width: 50px; height: 50px; border-radius: 50%; border: 3px dotted black; display: flex; align-items: center; padding: 10px">
                        <p style="text-align: center; font-size: 10px; font-weight: bold">${fixedOutlet.toUpperCase()}</p>
                    </div>
                </div>
                <div style="width: 100%; border-top: 2px dotted black; border-bottom: 2px dotted black; display: flex; gap: 5px; justify-content: center">
                    <p style="text-align: center; font-size: 10px">Hari/Tgl: ${
                      indonesianDay[day]
                    }, ${date}/${month}/${year}</p>                 
                    <p style="text-align: center; font-size: 10px">${hours}.${minute} WITA</p>
                    <p style="text-align: center; font-size: 10px">|</p>
                    <p style="text-align: center; font-size: 10px">Id Transaksi: ${transCode}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 5px; width: 60%; font-size: 10px">Nama Barang</th>
                            <th style="padding: 5px; font-size: 10px">Harga Per Pcs</th>
                            <th style="padding: 5px; width: 3%; font-size: 10px">Banyak Barang</th>
                            <th style="padding: 5px; font-size: 10px">Sub Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${datas
                          .map(
                            (data) => `
                        <tr>
                            <td style=" padding: 5px; font-size: 10px">${data.itemName.toUpperCase()}</td>
                            <td style=" padding: 5px; text-align: center; font-size: 10px">${rupiah(
                              data.price
                            )}</td>
                            <td style=" padding: 5px; text-align: center; font-size: 10px">x${
                              data.isUnitChecked !== "0"
                                ? data.isUnitChecked.split("-")[0] === "1"
                                  ? `${
                                      data.isUnitChecked.split("-")[1] /
                                      data.isUnitChecked.split("-")[2]
                                    } dus`
                                  : `${
                                      data.isUnitChecked.split("-")[1] /
                                      data.isUnitChecked.split("-")[2]
                                    } pack`
                                : `${data.quantity} pcs`
                            }</td>
                            <td style=" padding: 5px; text-align: center; font-size: 10px">${rupiah(
                              data.finalPrice
                            )}</td>
                        </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
                <div style="width: 100%; border-top: 2px dotted black; border-bottom: 2px dotted black">
                    <p style="text-align: center; font-size: 10px;">Total Keseluruhan: <span style="font-weight: bold">${rupiah(
                      totalKeseluruhan
                    )}<span/> <span style="font-weight: normal">| Keterangan: <span/><span style="font-weight: bold">${
          fixedIsBon ? "TAGIHAN" : "CASH"
        }<span/></p>
                </div>
                <div style="width: 100%;">
                    <p style="text-align: center;">NB: Barang yang expired/rusak bisa di return/tukar guling</p>
                    <p style="text-align: center;">Tanjung | Hp/WA: 085962720477 / 087834561712</p>
                    <p style="text-align: center;">Terima Kasih telah berbelanja di toko kami!</p>
                </div>
		<div style="width: 100%; display: flex; justify-content: center; gap: 60px; height: 100px; border: 2px solid black">
			<p style="font-size: 10px">Tanda Terima</p>
			<div style="text-align: center">
				<p style="font-size: 10px">Hormat Kami</p>
				<p style="font-size: 10px">(Ana Basalim)</p>
			</div>
		</div>
            </div>
            `,
      },
    ];

    const data2 = [
      {
        type: "html",
        format: "plain",
        data: `
            <div style="font-family: Arial, sans-serif; font-size: 10px; width: 100%; display: flex; justify-content: center; flex-direction: column;">
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center">
                    <img src=${abLogo} alt="Logo" style="max-width: 100px;"/>
                    <div style="width: 50px; height: 50px; border-radius: 50%; border: 3px dotted black; display: flex; align-items: center; padding: 10px">
                        <p style="text-align: center; font-size: 10px; font-weight: bold">${fixedOutlet.toUpperCase()}</p>
                    </div>
                </div>
                <div style="width: 100%; border-top: 2px dotted black; border-bottom: 2px dotted black; display: flex; gap: 5px; justify-content: center">
                    <p style="text-align: center; font-size: 10px">Hari/Tgl: ${
                      indonesianDay[day]
                    }, ${date}/${month}/${year}</p>                             
                    <p style="text-align: center; font-size: 10px">${hours}.${minute} WITA</p>
                    <p style="text-align: center; font-size: 10px">|</p>
                    <p style="text-align: center; font-size: 10px">Id Transaksi: ${transCode}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 5px; width: 60%; font-size: 10px">Nama Barang</th>
                            <th style="padding: 5px; font-size: 10px">Harga Per Pcs</th>
                            <th style="padding: 5px; width: 3%; font-size: 10px">Banyak Barang</th>
                            <th style="padding: 5px; font-size: 10px">Sub Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${datas
                          .map(
                            (data) => `
                        <tr>
                            <td style=" padding: 5px; font-size: 10px">${data.itemName.toUpperCase()}</td>
                            <td style=" padding: 5px; text-align: center; font-size: 10px">${rupiah(
                              data.price
                            )}</td>
                            <td style=" padding: 5px; text-align: center; font-size: 10px">x${
                              data.isUnitChecked !== "0"
                                ? data.isUnitChecked.split("-")[0] === "1"
                                  ? `${
                                      data.isUnitChecked.split("-")[1] /
                                      data.isUnitChecked.split("-")[2]
                                    } dus`
                                  : `${
                                      data.isUnitChecked.split("-")[1] /
                                      data.isUnitChecked.split("-")[2]
                                    } pack`
                                : `${data.quantity} pcs`
                            }</td>
                            <td style=" padding: 5px; text-align: center; font-size: 10px">${rupiah(
                              data.finalPrice
                            )}</td>
                        </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
                <div style="width: 100%; border-top: 2px dotted black; border-bottom: 2px dotted black">
                    <p style="text-align: center; font-size: 10px;">Total Keseluruhan: <span style="font-weight: bold">${rupiah(
                      totalKeseluruhan
                    )}<span/> <span style="font-weight: normal">| Keterangan: <span/><span style="font-weight: bold">TEMPO<span/></p>
                </div>
                <div style="width: 100%;">
                    <p style="text-align: center;">NB: Barang yang expired/rusak bisa di return/tukar guling</p>
                    <p style="text-align: center;">Tanjung | Hp/WA: 085962720477 / 087834561712</p>
                    <p style="text-align: center;">Terima Kasih telah berbelanja di toko kami!</p>
                </div>
		<div style="width: 100%; display: flex; justify-content: center; gap: 60px; height: 100px; border: 2px solid black">
			<p style="font-size: 10px">Tanda Terima</p>
			<div style="text-align: center">
				<p style="font-size: 10px">Hormat Kami</p>
				<p style="font-size: 10px">(Ana Basalim)</p>
			</div>
		</div>
            </div>
            `,
      },
    ];

    if (hutang === "CASH") {
      return qz
        .print(config, data)
        .then((result) => {
          console.log("Print 1 successful:", result);
          // console.log(printData);
        })
        .catch((err) => console.error("Print failed:", err));
    } else {
      return qz
        .print(config, data)
        .then((result) => {
          console.log("Print 1 successful:", result);

          // Cetakan kedua setelah cetakan pertama berhasil
          return qz.print(config, data2);
        })
        .then((result) => {
          console.log("Print 2 successful:", result);
        })
        .catch((err) => console.error("Print failed:", err));
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const searchProducts = async (query) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASEURL}/items/search`,
        {
          value: query,
        }
      );
      if (response) {
        setProductList(response.data.data);
        setShowDropdownProductCode(true);
      }
    } catch (error) {
      console.log(error.response);
      setProductList([]);
      setShowDropdownProductCode(false);
    }
  };

  const handleProductCodeChange = (e) => {
    const value = e.target.value;
    setProductCode(value);
    setProductName(value);
    if (value.length > 1) {
      searchProducts(value);
    } else {
      setShowDropdownProductCode(false);
    }
  };

  const handleSelectProduct = (product) => {
    setProductName(product.name);
    setProductCode(product.code);
    setShowDropdownProductCode(false);
  };

  const searchOutlet = async (query) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASEURL}/outlet/search`,
        {
          value: query,
        }
      );
      if (response) {
        setOutletList(response.data.data);
        setShowDropdownOutlet(true);
      }
    } catch (error) {
      console.log(error.response);
      setOutletList([]);
      setShowDropdownOutlet(false);
    }
  };

  const handleOutletChange = (e) => {
    const value = e.target.value;
    setOutlet({ id: null, name: value });
    if (value.length > 1) {
      searchOutlet(value);
    } else {
      setShowDropdownOutlet(false);
    }
  };

  const handleSalesOnChange = (e) => {
    const value = e.target.value;
    setSales(value);
  };

  const handleSelectOutlet = (outlet) => {
    setOutlet({ id: outlet.id, name: outlet.name });
    setShowDropdownOutlet(false);
  };

  const handlePriceOnChange = async (e, id, itemCode) => {
    e.preventDefault();

    const formattedValue = e.target.value;
    const rawValue = formattedValue.replace(/\D/g, ""); // Pastikan ini angka tanpa simbol
    const newPrice = Number(rawValue);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASEURL}/record/changePrice`,
        {
          itemId: id,
          newPrice: newPrice,
          turnCode: recordCode,
          itemCode: itemCode,
        }
      );

      if (response) {
        await getRecords(); // Update setelah perubahan sukses
      }
    } catch (error) {
      // Cek jika error status 400 (harga kurang dari harga modal)
      setMsg({ msg: error.response.data.msg, color: "red" });
      if (
        error.response.data.msg ===
        "Harga jual tidak boleh kurang dari harga modal"
      ) {
        // Kembalikan harga ke nilai sebelumnya
        setRecords((prevRecords) =>
          prevRecords.map((record) =>
            record.id === id
              ? {
                  ...record,
                  price: previousPrice[id],
                  formattedPrice: rupiah(previousPrice[id]),
                }
              : record
          )
        );
      }
    }
  };

  const handleFormattedPriceChange = (e, id) => {
    const rawValue = e.target.value.replace(/\D/g, ""); // Ambil angka tanpa simbol
    const formattedValue = rupiah(rawValue); // Format ke dalam bentuk rupiah

    // Simpan harga sebelumnya sebelum melakukan perubahan (hanya simpan jika belum ada)
    setPreviousPrice((prev) => {
      // Hanya set nilai awal jika previousPrice untuk id ini belum tersimpan
      if (!prev[id]) {
        return {
          ...prev,
          [id]: records.find((record) => record.id === id).price,
        };
      }
      return prev; // Jika sudah ada, tidak perlu mengubah lagi
    });

    setRecords((prevRecords) =>
      prevRecords.map((record) =>
        record.id === id
          ? { ...record, price: rawValue, formattedPrice: formattedValue }
          : record
      )
    );
  };

  const handleFormattedCashChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const formattedValue = rupiah(rawValue);
    setCash(rawValue);
    setFormattedCash(formattedValue);
  };

  const handleCashOnChange = () => {
    const newCash = Number(cash);
    setCash(newCash);
    setFormattedCash(rupiah(newCash));
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BASEURL}/record/${recordId}`
      );
      if (response) {
        await getRecords();
      }
    } catch (error) {
      console.log(error.response);
      setMsg({ msg: error.response.data.msg, color: "red" });
    }
  };

  const handlePrintFromAdmin = async (data, outletName) => {
    try {
      const getRecordsResponse = await axios.get(
        `${import.meta.env.VITE_BASEURL}/orders/adminRequest/orderRecord/${
          data.turnCode
        }`
      );

      const newDatas = getRecordsResponse.data;

      setPrintData({
        datas: newDatas,
        transCode: data.transCode,
        from: "admin",
        isBonFromAdmin: data.isBon,
        outletName: outletName.name,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const quantityStyle = {
    width: "200px",
    marginLeft: "2px",
  };
  const addButtonStyle = {
    width: "300px",
    backgroundColor: "darkgoldenrod",
    fontWeight: "bold",
    color: "white",
    marginLeft: "10px",
  };
  const tableStyle = {
    width: "100%",
    border: "25px solid transparent",
    backgroundColor: "transparent",
  };
  const nameTableStyle = {
    width: "400px",
    overflow: "hidden",
  };
  const totalBayar = {
    fontSize: "40px",
    color: "black",
    fontWeight: "bold",
  };
  const totalKembalian = {
    fontSize: "30px",
    color: "#14161a",
    fontWeight: "bold",
    marginRight: "20px",
  };
  const returnAndDiscountStyle = {
    position: "absolute",
    right: "0px",
  };

  const dropdownStyle = {
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    gap: "10px",
    backgroundColor: "black",
    width: "580px",
    maxHeight: "200px",
    overflow: "scroll",
    padding: "10px 0px 10px 0px",
    marginTop: "40px",
  };

  const dropdownStyleOutlet = {
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    gap: "10px",
    backgroundColor: "black",
    width: "580px",
    maxHeight: "200px",
    minHeight: "200px",
    overflow: "scroll",
    padding: "10px 0px 10px 0px",
    top: "-200px",
    // marginTop: "40px",
  };

  //---------------------------
  if (!cP()) {
    return (
      <div></div>
    )
  }
  //---------------------------

  return (
    <div className="is-flex">
      <Sidebar role={userRole} />
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
      {/* logic Loading */}
      {isContainerLoading ? (
        <>
          <div
            style={{
              width: "83%%",
              height: "100vh",
              backgroundColor: "black",
              marginLeft: "320px",
            }}
          >
            <SpinnerLoader color={"white"} width={"100px"} />
          </div>
        </>
      ) : (
        <>
          <div className="myCashierContainer">
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ width: "100%", display: "flex", gap: "10px" }}>
                <div className="judul">
                  <h1>Kasir {userRole === "admin" ? userRole : ""}</h1>
                </div>
                {userRole === "kasir" && (
                  <div
                    style={{
                      width: "60%",
                      height: "160px",
                      // backgroundColor: "black",
                      padding: "10px",
                      display: "flex",
                      alignItems: "center",
                      // borderLeft: "5px solid grey",
                      // border: "5px solid darkorange"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        // gap: "15px",
                        overflowY: "scroll",
                        width: "100%",
                        height: "130px",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", gap: "20px" }}>
                        <p style={{ color: "black" }}>
                          PERMINTAAN PRINT DARI ADMIN
                        </p>
                        {refreshLoadingAdminRequest ? (
                          <>
                            <p>Loading...</p>
                          </>
                        ) : (
                          <>
                            <i
                              style={{ cursor: "pointer", color: "green" }}
                              onClick={() => getRequestPrintFromAdmin(true)}
                            >
                              <CIcon
                                style={{ transform: "scale(0.8)" }}
                                icon={icon.cilReload}
                              />
                            </i>
                          </>
                        )}
                      </div>
                      <ul
                        style={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          gap: "5px",
                        }}
                      >
                        {requestPrintDataFromAdmin.map((data, index) => {
                          const outlet = outletSearching.find(
                            (otl) =>
                              otl.index === index && otl.outletId == data.outlet
                          );

                          return (
                            <li
                              key={index}
                              style={{
                                backgroundColor: "lightgreen",
                                padding: "5px",
                                display: "flex",
                                gap: "5px",
                                alignItems: "center",
                                width: "100%",
                                borderRadius: "10px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  width: "80%",
                                }}
                              >
                                <i
                                  style={{
                                    color: "green",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <CIcon icon={icon.cilBellExclamation} />
                                </i>
                                <p style={{ color: "white" }}>
                                  {convertTanggal(data.createdAt)} |{" "}
                                  {outlet
                                    ? `${outlet.name.toUpperCase()}`
                                    : "Loading..."}{" "}
                                  ~{" "}
                                  <span style={{ color: "green" }}>
                                    {"["}
                                    {rupiah(data.totalPayment)}
                                    {"]"}
                                  </span>
                                </p>
                              </div>

                              <button
                                className="button"
                                style={{
                                  width: "15%",
                                  backgroundColor: "green",
                                  border: "none",
                                }}
                                onClick={() =>
                                  handlePrintFromAdmin(data, outlet)
                                }
                              >
                                Print
                              </button>
                              <button
                                className="button"
                                style={{
                                  width: "5%",
                                  backgroundColor: "transparent",
                                  border: "none",
                                  color: "green",
                                }}
                                onClick={async () => {
                                  try {
                                    const response = await axios.put(
                                      `${
                                        import.meta.env.VITE_BASEURL
                                      }/orders/adminRequest/${data.turnCode}`
                                    );
                                    if (response) console.log(response);
                                    getRequestPrintFromAdmin(
                                      false,
                                      data.id,
                                      index
                                    );
                                  } catch (error) {
                                    console.error(error);
                                  }
                                }}
                              >
                                &times;
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div className="formContainer" style={{ position: "relative" }}>
                <form
                  onSubmit={record}
                  className="is-flex codeForm"
                  style={{ gap: "8px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                    }}
                  >
                    <input
                      type="text"
                      className="input"
                      placeholder="Cari Barang dengan memasukkan 'kode' Barang atau 'nama' Barang"
                      value={productName}
                      onChange={handleProductCodeChange}
                      style={{ backgroundColor: "#fff", color: "black" }}
                    />
                    {showDropdownProductCode && (
                      <ul className="dropdown" style={dropdownStyle}>
                        {productList.map((product) => (
                          <li
                            style={{ cursor: "pointer", color: "green" }}
                            key={product.code}
                            onClick={() => handleSelectProduct(product)}
                          >
                            [{product.code}]{" "}
                            <span style={{ color: "white" }}>
                              {product.name.toUpperCase()} ~ (
                              {rupiah(product.price)})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    style={{
                      ...quantityStyle,
                      backgroundColor: "#fff",
                      color: "black",
                    }}
                    type="number"
                    className="input"
                    placeholder="Jumlah"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      marginRight: "10px",
                      padding: "10px",
                    }}
                  >
                    <h1 style={{ color: "black", fontWeight: "bold" }}>Dus</h1>
                    <input
                      type="checkbox"
                      checked={isUnitChecked}
                      onChange={(e) => {
                        setIsUnitChecked(e.target.checked);
                        if (e.target.checked) {
                          setIsPackChecked(false);
                        }
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      marginRight: "10px",
                      padding: "10px",
                    }}
                  >
                    <h1 style={{ color: "black", fontWeight: "bold" }}>Pack</h1>
                    <input
                      type="checkbox"
                      checked={isPackChecked}
                      onChange={(e) => {
                        setIsPackChecked(e.target.checked);
                        if (e.target.checked) {
                          setIsUnitChecked(false);
                        }
                      }}
                    />
                  </div>
                  <button
                    disabled={isRecordsLoading}
                    style={{
                      ...addButtonStyle,
                      backgroundColor: "darkgoldenrod",
                    }}
                    className="button is-success"
                  >
                    <i style={{ color: "#fff" }}>
                      <CIcon icon={icon.cilChevronDoubleDown} />
                    </i>
                  </button>
                </form>
              </div>
            </div>
            <div
              style={{
                flex: "1",
                overflow: "auto",
                display: "flex",
                paddingLeft: "20px",
              }}
            >
              <div
                className="orderView"
                style={{
                  backgroundColor: records.length > 0 ? "lightgrey" : "black",
                }}
              >
                <table style={tableStyle} className="table">
                  <thead style={{ backgroundColor: "black" }}>
                    <tr>
                      <th style={{ width: "0%", color: "#fff" }}>
                        <i>
                          <CIcon icon={icon.cilSortAscending} />
                        </i>
                      </th>
                      <th style={{ color: "#fff", width: "0%" }}>Kode</th>
                      <th style={{ color: "#fff", width: "40%" }}>
                        Nama Barang
                      </th>
                      <th style={{ color: "#fff", width: "15%" }}>
                        Harga Modal{" (pcs)"}
                      </th>
                      <th style={{ color: "#fff", width: "15%" }}>
                        Harga Jual{" (pcs)"}
                      </th>
                      <th style={{ color: "#fff", width: "10%" }}>Jumlah</th>
                      <th style={{ color: "#fff", width: "10%" }}>Profit</th>
                      <th style={{ color: "#fff", width: "10%" }}>Total</th>
                      <th style={{ color: "#fff", width: "0%" }}>
                        <i style={{ color: "#fff" }}>
                          <CIcon icon={icon.cilControl}></CIcon>
                        </i>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr key={index} style={{ backgroundColor: "#fff" }}>
                        <th style={{ verticalAlign: "middle", color: "grey" }}>
                          {index + 1}
                        </th>
                        <td style={{ verticalAlign: "middle", color: "grey" }}>
                          {record.itemCode}
                        </td>
                        <td
                          style={{
                            nameTableStyle,
                            verticalAlign: "middle",
                            color: "grey",
                          }}
                        >
                          {record.itemName.toUpperCase()}
                        </td>
                        <td style={{ verticalAlign: "middle", color: "grey" }}>
                          {rupiah(record.capitalPrice)}
                        </td>
                        <td style={{ verticalAlign: "middle" }}>
                          <input
                            disabled={isRecordsLoading}
                            className="input"
                            style={{
                              padding: "0px 5px",
                              backgroundColor: "#fff",
                              color: "black",
                            }}
                            type="text"
                            value={
                              record.formattedPrice || rupiah(record.price)
                            }
                            onChange={(e) =>
                              handleFormattedPriceChange(e, record.id)
                            }
                            onBlur={(e) => {
                              handleFunLoading(
                                setIsRecordsLoading,
                                handlePriceOnChange,
                                [e, record.id, record.itemCode]
                              );
                            }}
                          />
                        </td>
                        <td
                          style={{
                            verticalAlign: "middle",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              paddingTop: "5px",
                            }}
                          >
                            {/* tombol kiri kanan */}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <button
                                disabled={isRecordsLoading}
                                style={{
                                  position: "relative",
                                  backgroundColor: "darkorange",
                                  border: "none",
                                  color: "#fff",
                                }}
                                onClick={() => {
                                  handleFunLoading(
                                    setIsRecordsLoading,
                                    handleQuantityArrowOnClick,
                                    [true, record.id]
                                  );
                                }}
                                className="button"
                              >
                                &minus;
                                <span
                                  style={{
                                    fontSize: "10px",
                                    position: "absolute",
                                    left: "21px",
                                    top: "4px",
                                  }}
                                >
                                  1
                                </span>
                              </button>
                              <button
                                style={{
                                  backgroundColor: "darkorange",
                                  border: "none",
                                  color: "#fff",
                                }}
                                onClick={() => {}}
                                className="button"
                              >
                                &lt;
                              </button>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                width: "80px",
                                // justifyContent: "space-between",
                                // padding: "0px 15px",
                                textAlign: "center",
                              }}
                            >
                              {/* pola isUnitChecked = ["0" = pcs], ["1-12-12" = dus], ["2-12-12" = pack] */}
                              {record.isUnitChecked !== "0" ? (
                                record.isUnitChecked.split("-")[0] === "1" ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "20px",
                                      justifyContent: "space-between",
                                      flexDirection: "column",
                                      width: "100%",
                                    }}
                                  >
                                    <p style={{ color: "grey" }}>
                                      {record.isUnitChecked.split("-")[1] /
                                        record.isUnitChecked.split("-")[2]}
                                    </p>
                                    <p style={{ color: "crimson" }}>DUS</p>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "20px",
                                      justifyContent: "space-between",
                                      flexDirection: "column",
                                      width: "100%",
                                    }}
                                  >
                                    <p style={{ color: "grey" }}>
                                      {record.isUnitChecked.split("-")[1] /
                                        record.isUnitChecked.split("-")[2]}
                                    </p>
                                    <p style={{ color: "crimson" }}>PCK</p>
                                  </div>
                                )
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "20px",
                                    justifyContent: "space-between",
                                    flexDirection: "column",
                                    width: "100%",
                                  }}
                                >
                                  <p style={{ color: "grey" }}>
                                    {record.quantity}
                                  </p>
                                  <p style={{ color: "crimson" }}>PCS</p>
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "5px",
                              }}
                            >
                              <button
                                disabled={isRecordsLoading}
                                style={{
                                  position: "relative",
                                  backgroundColor: "darkorange",
                                  border: "none",
                                  color: "#fff",
                                }}
                                onClick={() => {
                                  handleFunLoading(
                                    setIsRecordsLoading,
                                    handleQuantityArrowOnClick,
                                    [false, record.id]
                                  );
                                }}
                                className="button"
                              >
                                +
                                <span
                                  style={{
                                    fontSize: "10px",
                                    position: "absolute",
                                    left: "21px",
                                    top: "4px",
                                  }}
                                >
                                  1
                                </span>
                              </button>
                              <button
                                style={{
                                  backgroundColor: "darkorange",
                                  border: "none",
                                  color: "#fff",
                                }}
                                onClick={() => {}}
                                className="button"
                              >
                                &gt;
                              </button>
                            </div>
                          </div>
                        </td>
                        <td style={{ verticalAlign: "middle", color: "grey" }}>
                          {rupiah(record.profit)}
                        </td>
                        <td style={{ verticalAlign: "middle", color: "grey" }}>
                          {rupiah(record.finalPrice)}{" "}
                          <span style={{ color: "red" }}>
                            {record.discount > 0
                              ? `(-${record.discount * 100}%)`
                              : ""}
                          </span>
                        </td>
                        <td style={{ verticalAlign: "middle" }}>
                          <button
                            disabled={isRecordsLoading}
                            style={{
                              verticalAlign: "middle",
                              backgroundColor: "rgb(200, 10, 50)",
                              border: "none",
                              color: "#fff",
                            }}
                            className="button"
                            onClick={() => {
                              handleFunLoading(
                                setIsRecordsLoading,
                                handleDeleteRecord,
                                [record.id]
                              );
                            }}
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div
              style={{
                position: "",
                top: "100%",
                width: "100%",
                padding: "0px 20px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <h1 style={totalBayar}>Total Keseluruhan:</h1>
                <h1 style={totalBayar}>{total}</h1>
              </div>
              <form
                onSubmit={
                  userRole === "admin" ? sendOrdersToKasir : storeOrders
                }
                className="is-flex codeForm mt-5"
              >
                <input
                  style={quantityStyle}
                  type="hidden"
                  value={recordCode}
                  className="input"
                />
                {/* jika menggunakan cash aktifkan input dibawah */}
                {/* <input 
                                          style={quantityStyle} 
                                          type="text" 
                                          className='input' 
                                          placeholder='Cash' 
                                          value={formattedCash || cash} 
                                          onChange={handleFormattedCashChange} 
                                          onBlur={handleCashOnChange} 
                                      /> */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    marginRight: "10px",
                  }}
                >
                  <h1 style={{ color: "black", fontWeight: "bold" }}>Tempo</h1>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      setIsBon(e.target.checked);
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "10px",
                    width: "100%",
                    marginLeft: "2px",
                    position: "relative",
                  }}
                >
                  <input
                    type="text"
                    className="input"
                    placeholder="Cari Outlet"
                    value={outlet.name}
                    onChange={handleOutletChange}
                    style={{ backgroundColor: "#fff", color: "black" }}
                  />
                  {showDropdownOutlet && (
                    <ul className="dropdown" style={dropdownStyleOutlet}>
                      {outletList.map((outlet) => (
                        <li
                          style={{ cursor: "pointer", color: "white" }}
                          key={outlet.id}
                          onClick={() => handleSelectOutlet(outlet)}
                        >
                          {outlet.name.toUpperCase()}
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* <input
                          type="text"
                          className="input"
                          placeholder="Sales"
                          onChange={handleSalesOnChange}
                        /> */}
                  <select
                    onChange={handleSalesOnChange}
                    className="input"
                    name="sales"
                    id="sales"
                    value={sales}
                    style={{ backgroundColor: "#fff", color: "black" }}
                  >
                    <option value="Ana">Ana</option>
                    <option value="Eman">Eman</option>
                    <option value="Eva">Eva</option>
                    <option value="Uyung">Uyung</option>
                    <option value="Dwik">Dwik</option>
                    <option value="Adam">Adam</option>
                    <option value="Feri">Feri</option>
                    <option value="Eyung">Eyung</option>
                    <option value="Arif">Arif</option>
                    <option value="Umi Dawas">Umi Dawas</option>
                    <option value="Eja">Eja</option>
                  </select>
                </div>
                {isStoreClicked ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "300px",
                    }}
                  >
                    <button
                      style={{
                        ...addButtonStyle,
                        backgroundColor: "rgb(200, 10, 50)",
                      }}
                      className="button is-success"
                      disabled={!isStoreClicked}
                      onClick={() =>
                        createRecipt(
                          printData.datas,
                          printData.transCode,
                          printData.from,
                          printData.isBonFromAdmin,
                          printData.outletName
                        )
                      }
                    >
                      <i style={{ display: "flex", alignItems: "center" }}>
                        <CIcon icon={icon.cilPrint} />
                      </i>
                    </button>
                    <button
                      style={{ ...addButtonStyle, backgroundColor: "green" }}
                      className="button is-success"
                      disabled={!isStoreClicked}
                      onClick={handleRefresh}
                    >
                      <i style={{ display: "flex", alignItems: "center" }}>
                        <CIcon icon={icon.cilReload} />
                      </i>
                    </button>
                  </div>
                ) : (
                  <button
                    style={addButtonStyle}
                    className="button is-success"
                    disabled={isStoreClicked || isRecordsLoading || isCreateOrderClicked}
                    type="submit"
                  >
                    {userRole === "admin" ? "Kirim Ke Kasir" : "Buat Order"}
                  </button>
                )}
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cashier;
