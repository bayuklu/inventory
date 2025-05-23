import React, { act, useEffect } from "react";
import Sidebar from "./Sidebar";
import axios from "axios";
import "../index.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CIcon from "@coreui/icons-react";
import * as icon from "@coreui/icons";
import { jwtDecode } from "jwt-decode";
import SpinnerLoader from "./SpinnerLoader";

const Inventory = () => {
  const [msg, setMsg] = useState({});
  const [items, setItems] = useState([]);
  const [activeButton, setActiveButton] = useState("All Category");
  const [dataView, setDataView] = useState("All Category");
  const [hideFormAddProduct, setHideFormAddProduct] =
    useState("hideFormAddProduct");
  const [hideFormAddStock, setHideFormAddStock] = useState("hideFormAddStock");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("foods");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("");
  const [unitPack, setUnitPack] = useState("");
  const [capitalPrice, setCapitalPrice] = useState("");
  const [discount, setDiscount] = useState("");

  const [codeAddStock, setCodeAddStock] = useState("");
  const [nameAddStock, setNameAddStock] = useState("");
  const [stockAddStock, setStockAddStock] = useState("");
  const [search, setSearch] = useState("");

  const [totalAddStock, setTotalAddStock] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isNoLoggedIn, setIsNoLoggedIn] = useState(false);
  const [authCheck, setAuthCheck] = useState(true);

  const [previousDus, setPreviousDus] = useState({});
  const [previousPack, setPreviousPack] = useState({});
  const [previousPrice, setPreviousPrice] = useState({});
  const [previousCapitalPrice, setPreviousCapitalPrice] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "AB FROZEN | Inventory";
    refreshToken();
  }, []);

  useEffect(() => {
    // console.log(dataView)
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (
          decoded.role === "admin" &&
          items.length === 0 &&
          dataView === "All Category"
        ) {
          // console.log("Mount")
          fetchItemsData("All Category", true);
        }
      } catch (error) {
        console.error("Token decoding failed:", error);
      }
    }
  }, [token, items, dataView]);

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

  const addproduct = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosJWT.post(
        `${import.meta.env.VITE_BASEURL}/items`,
        {
          name: name,
          category: category,
          price: price,
          stock: stock,
          unit: unit,
          unitPack: unitPack,
          discount: discount,
          capitalPrice: parseInt(capitalPrice),
        }
      );
      if (response) {
        setHideFormAddProduct("hideFormAddProduct");
        setActiveButton(response.data.activeButton);
        setItems(response.data.dataView);
        setMsg({ msg: response.data.msg, color: "green" });
      }
    } catch (error) {
      setMsg({ msg: error.response.data.msg, color: "red" });
    }
  };

  const addstock = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosJWT.put(
        `${import.meta.env.VITE_BASEURL}/items/stock/${codeAddStock}`,
        {
          stockAdded: totalAddStock,
          dataView: dataView,
        }
      );
      if (response) {
        fetchItemsData(dataView, false);
        setHideFormAddStock("hideFormAddStock");
        setStockAddStock(response.data.data);
        setMsg({ msg: response.data.msg, color: "green" });
      }
    } catch (error) {
      setMsg({ msg: error.response.data.msg, color: "red" });
    }
  };

  const handleDeleteItems = async (code, name) => {
    if (confirm(`Are you sure want to delete ${name.toUpperCase()}?`) != true)
      return;
    try {
      const response = await axiosJWT.delete(
        `${import.meta.env.VITE_BASEURL}/items/${code}`
      );
      if (response) {
        fetchItemsData(dataView, false);
        setMsg({ msg: response.data.msg, color: "green" });
      }
    } catch (error) {
      console.log(error);
      setMsg({ msg: error.response.data.msg, color: "red" });
    }
  };

  const fetchItemsData = async (category, isFirstLoad) => {
    // console.log(isFirstLoad)

    try {
      setDataView(category);

      if (category === "") {
        return handleSearch(null, false);
      }

      const url =
        category === "All Category"
          ? `${import.meta.env.VITE_BASEURL}/items`
          : `${import.meta.env.VITE_BASEURL}/items/${category}`;
      let response = await axiosJWT.get(url, {
        withCredentials: true,
      });

      if (isFirstLoad) {
        setItems(response.data.data);
      } else {
        // console.log("is Not First Load")
        setItems((prevItems) => [...prevItems]);
      }
      setActiveButton(category);
    } catch (error) {
      console.log(error);
      setMsg({ msg: error.response.data.msg, color: "red" });
    }
  };

  const rupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  const handleAddStock = (code, name, stock) => {
    setCodeAddStock(code);
    setNameAddStock(name);
    setStockAddStock(stock);
    setHideFormAddStock("");
  };

  const handleShowFormAddProduct = () => {
    setHideFormAddProduct("");
  };

  const handleHideFormAddProduct = () => {
    setHideFormAddProduct("hideFormAddProduct");
  };

  const handleHideFormAddStock = () => {
    setHideFormAddStock("hideFormAddStock");
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleSearch = async (e, isFirstLoad) => {
    // console.log(e, isFirstLoad)
    if (e) {
      e.preventDefault();
    }

    try {
      const response = await axiosJWT.post(
        `${import.meta.env.VITE_BASEURL}/items/search`,
        {
          value: search,
        }
      );

      if (isFirstLoad) {
        setItems(response.data.data);
      } else {
        setItems((prevItems) => [...prevItems]);
      }

      setDataView("");
      setActiveButton("");
    } catch (error) {
      setItems([]);
      setMsg({ msg: error.response.data.msg, color: "red" });
    }
  };

  const handleDusFormattedNumberChange = (e, id) => {
    const rawValue = e.target.value.replace(/\D/g, "");

    // console.log('Id di handler change: ' + id)

    setPreviousDus((prev) => {
      if (!prev[id]) {
        return {
          ...prev,
          [id]: items.find((item) => item.id === id).unitTotal,
        };
      }
      return prev;
    });

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, unitTotal: rawValue } : item
      )
    );
  };

  const handlePackFormattedNumberChange = (e, id) => {
    const rawValue = e.target.value.replace(/\D/g, "");

    // console.log('Id di handler change: ' + id)

    setPreviousPack((prev) => {
      if (!prev[id]) {
        return {
          ...prev,
          [id]: items.find((item) => item.id === id).unitTotalPack,
        };
      }
      return prev;
    });

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, unitTotalPack: rawValue } : item
      )
    );
  };

  const handlePriceFormattedNumberChange = (e, id) => {
    console.log(e.target.value);
    const rawValue = e.target.value.replace(/\D/g, "");
    const formattedValue = rupiah(rawValue); // Format ke dalam bentuk rupiah

    // console.log('Id di handler change: ' + id)

    setPreviousPrice((prev) => {
      if (!prev[id]) {
        return {
          ...prev,
          [id]: items.find((item) => item.id === id).price,
        };
      }
      return prev;
    });

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? { ...item, price: rawValue, formattedPrice: formattedValue }
          : item
      )
    );
  };

  const handleCapitalPriceFormattedNumberChange = (e, id) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const formattedValue = rupiah(rawValue); // Format ke dalam bentuk rupiah

    // console.log('Id di handler change: ' + id)

    setPreviousCapitalPrice((prev) => {
      if (!prev[id]) {
        return {
          ...prev,
          [id]: items.find((item) => item.id === id).capitalPrice,
        };
      }
      return prev;
    });

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,
              capitalPrice: rawValue,
              formattedCapitalPrice: formattedValue,
            }
          : item
      )
    );
  };

  const handleDusChanged = async (e, itemId) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const newDusValue = Number(rawValue);

    try {
      const response = await axiosJWT.put(
        `${import.meta.env.VITE_BASEURL}/items/update/dus`,
        {
          withCredentials: true,
          itemId,
          newDusValue,
        }
      );

      if (response) {
        setMsg({ msg: response.data.msg, color: "green" });
        fetchItemsData(dataView, false);
        document.activeElement.blur();
      }
    } catch (error) {
      console.error(error.message, error);
    }
  };

  const handlePackChanged = async (e, itemId) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const newPackValue = Number(rawValue);

    console.log(typeof newPackValue);

    try {
      const response = await axiosJWT.put(
        `${import.meta.env.VITE_BASEURL}/items/update/pack`,
        {
          withCredentials: true,
          itemId,
          newPackValue,
        }
      );

      if (response) {
        console.log(dataView);
        setMsg({ msg: response.data.msg, color: "green" });
        fetchItemsData(dataView, false);
        document.activeElement.blur();
      }
    } catch (error) {
      console.error(error.message, error);
    }
  };

  const handlePriceChanged = async (e, itemId) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const newPriceValue = Number(rawValue);

    // console.log(typeof(newPriceValue))

    try {
      const response = await axiosJWT.put(
        `${import.meta.env.VITE_BASEURL}/items/update/price`,
        {
          withCredentials: true,
          itemId,
          newPriceValue,
        }
      );

      if (response.status === 200) {
        setMsg({ msg: response.data.msg, color: "green" });
        fetchItemsData(dataView, false);
        document.activeElement.blur();
      }
    } catch (error) {
      console.error(error.message, error);
      if (
        error.response.data.msg ===
        "Harga jual tidak boleh kurang dari harga modal"
      ) {
        // Kembalikan harga ke nilai sebelumnya
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  price: previousPrice[itemId],
                  formattedPrice: rupiah(previousPrice[itemId]),
                }
              : item
          )
        );
        setMsg({ msg: error.response.data.msg, color: "red" });
      }
    }
  };

  const handleCapitalPriceChanged = async (e, itemId) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const newCapitalPriceValue = Number(rawValue);

    // console.log(typeof(newCapitalPriceValue))

    try {
      const response = await axiosJWT.put(
        `${import.meta.env.VITE_BASEURL}/items/update/capitalprice`,
        {
          withCredentials: true,
          itemId,
          newCapitalPriceValue,
        }
      );

      if (response.status === 200) {
        console.log(dataView);
        setMsg({ msg: response.data.msg, color: "green" });
        fetchItemsData(dataView, false);
        document.activeElement.blur();
      }
    } catch (error) {
      console.error(error.message, error);
      if (
        error.response.data.msg ===
        "Harga modal tidak boleh lebih dari harga jual"
      ) {
        // Kembalikan harga ke nilai sebelumnya
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  capitalPrice: previousCapitalPrice[itemId],
                  formattedCapitalPrice: rupiah(previousCapitalPrice[itemId]),
                }
              : item
          )
        );
        setMsg({ msg: error.response.data.msg, color: "red" });
      }
    }
  };

  // console.log(items)

  const tableStyle = {
    width: "100%",
  };

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

      <div className="inventoryContainer">
        <div className="judul">
          <h1>Inventory</h1>
        </div>
        <div className="inventoryMenu">
          <ul>
            <li>
              <button
                className={
                  activeButton === "All Category" ? "is-active-btn" : ""
                }
                onClick={() => fetchItemsData("All Category", true)}
              >
                All Category
              </button>
            </li>
            <li>
              <button
                className={activeButton === "Foods" ? "is-active-btn" : ""}
                onClick={() => fetchItemsData("Foods", true)}
              >
                Foods
              </button>
            </li>
            <li>
              <button
                className={activeButton === "Drinks" ? "is-active-btn" : ""}
                onClick={() => fetchItemsData("Drinks", true)}
              >
                Drinks
              </button>
            </li>
            <li>
              <button
                className={activeButton === "Bathroom" ? "is-active-btn" : ""}
                onClick={() => fetchItemsData("Bathroom", true)}
              >
                Bathrooms
              </button>
            </li>
            <li>
              <button
                className={activeButton === "Kitchen" ? "is-active-btn" : ""}
                onClick={() => fetchItemsData("Kitchen", true)}
              >
                Kithcens
              </button>
            </li>
            <li>
              <button onClick={handleShowFormAddProduct}>Add Product</button>
            </li>
            <li>
              <form
                onSubmit={(e) => handleSearch(e, true)}
                style={{ display: "flex", alignItems: "center", gap: "2px" }}
              >
                <input
                  placeholder="Search"
                  type="text"
                  className="searchItem"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  style={{
                    width: "50px",
                    height: "41px",
                    border: "none",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                  }}
                  type="submit"
                  className="button"
                >
                  <i style={{ lineHeight: "10px" }}>
                    <CIcon icon={icon.cilSearch} />
                  </i>
                </button>
              </form>
            </li>
          </ul>
        </div>
        <div className="tableContainer">
          <table style={tableStyle} className="table">
            <thead>
              <tr>
                <th style={{ color: "white" }}>
                  <abbr title="Position">No</abbr>
                </th>
                <th style={{ color: "white" }}>Code</th>
                <th style={{ color: "white" }}>Product Name</th>
                <th style={{ color: "white" }}>Stock</th>
                <th style={{ color: "white" }}>Isi 1 Dus</th>
                <th style={{ color: "white" }}>Isi 1 Pack</th>
                <th style={{ color: "white" }}>Discount</th>
                <th style={{ color: "white" }}>Original Price</th>
                <th style={{ color: "white" }}>Capital Price</th>
                <th style={{ color: "white" }}>Control</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 &&
                items.map((item, index) => (
                  <tr
                    key={index}
                    className={item.stock <= 0 ? "stockHabis" : ""}
                  >
                    <td>{index + 1}</td>
                    <td>{item.code}</td>
                    <td>{item.name.toUpperCase()}</td>
                    <td>
                      {item.stock}{" "}
                      <span style={{ fontSize: "12px", color: "grey" }}>
                        pcs
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="text"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleDusChanged(e, item.id);
                          }}
                          // onBlur={(e) => handleDusChanged(e, item.id)}
                          onChange={(e) =>
                            handleDusFormattedNumberChange(e, item.id)
                          }
                          style={{
                            paddingRight: "45px",
                            marginLeft: "-25px",
                            width: "100px",
                            textAlign: "center",
                          }}
                          className="input"
                          value={item.unitTotal}
                        />
                        <span
                          style={{
                            pointerEvents: "none",
                            position: "absolute",
                            left: "50%",
                            fontSize: "12px",
                            color: "grey",
                            marginLeft: "-5px",
                            zIndex: "10",
                          }}
                        >
                          pcs
                        </span>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="text"
                          style={{
                            paddingRight: "45px",
                            marginLeft: "-25px",
                            width: "100px",
                            textAlign: "center",
                          }}
                          className="input"
                          value={item.unitTotalPack}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handlePackChanged(e, item.id);
                          }}
                          // onBlur={(e) => handlePackChanged(e, item.id)}
                          onChange={(e) =>
                            handlePackFormattedNumberChange(e, item.id)
                          }
                        />
                        <span
                          style={{
                            pointerEvents: "none",
                            position: "absolute",
                            left: "50%",
                            fontSize: "12px",
                            color: "grey",
                            marginLeft: "-5px",
                            zIndex: "10",
                          }}
                        >
                          pcs
                        </span>
                      </div>
                    </td>
                    <td>{item.discount * 100}%</td>
                    {/* <td>{rupiah(item.price)}</td> */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="text"
                          style={{
                            width: "130px",
                            marginLeft: "-25px",
                            textAlign: "center",
                          }}
                          className="input"
                          value={items.formattedPrice || rupiah(item.price)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handlePriceChanged(e, item.id);
                          }}
                          // onBlur={(e) => {
                          //   const itemId = item.id
                          //   setItems((prevItems) =>
                          //     prevItems.map((item) =>
                          //       item.id === itemId
                          //         ? {
                          //             ...item,
                          //             price: previousPrice[itemId],
                          //             formattedCapitalPrice: rupiah(previousPrice[itemId]),
                          //           }
                          //         : item
                          //     )
                          //   );
                          // }}
                          onChange={(e) =>
                            handlePriceFormattedNumberChange(e, item.id)
                          }
                        />
                      </div>
                    </td>
                    {/* <td>{rupiah(item.capitalPrice)}</td> */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="text"
                          style={{
                            width: "130px",
                            marginLeft: "-25px",
                            textAlign: "center",
                          }}
                          className="input"
                          value={
                            items.formattedCapitalPrice ||
                            rupiah(item.capitalPrice)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleCapitalPriceChanged(e, item.id);
                          }}
                          // onBlur={(e) => {
                          //   const itemId = item.id
                          //   setItems((prevItems) =>
                          //     prevItems.map((item) =>
                          //       item.id === itemId
                          //         ? {
                          //             ...item,
                          //             capitalPrice: previousCapitalPrice[itemId],
                          //             formattedCapitalPrice: rupiah(previousCapitalPrice[itemId]),
                          //           }
                          //         : item
                          //     )
                          //   )
                          // }}
                          onChange={(e) =>
                            handleCapitalPriceFormattedNumberChange(e, item.id)
                          }
                        />
                      </div>
                    </td>
                    <td>
                      <button
                        style={{
                          border: "none",
                          color: "white",
                          backgroundColor: "darkgreen",
                        }}
                        onClick={() =>
                          handleAddStock(item.code, item.name, item.stock)
                        }
                        className="button is-small"
                      >
                        + Stock
                      </button>
                      <button
                        disabled
                        style={{
                          border: "none",
                          color: "white",
                          backgroundColor: "darkred",
                        }}
                        onClick={() => handleDeleteItems(item.code, item.name)}
                        className="button ml-3 is-small"
                      >
                        <i>
                          <CIcon icon={icon.cilTrash} />
                        </i>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* form add product */}
        <div
          onClick={handleHideFormAddProduct}
          className={`formAddProduct ${hideFormAddProduct}`}
        >
          <form onSubmit={addproduct} onClick={stopPropagation} action="">
            <div className="field">
              <label style={{ color: "white" }} className="label">
                Product Name
              </label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder=""
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <p style={{ color: "white" }} className="help">
                Masukkan nama produk
              </p>
            </div>
            <div className="field">
              <label style={{ color: "white" }} className="label">
                Category
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    className=""
                    name="category"
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="foods">Foods</option>
                    <option value="drinks">Drinks</option>
                    <option value="bathroom">Bathrooms</option>
                    <option value="kitchen">Kitchens</option>
                  </select>
                </div>
              </div>
              <p style={{ color: "white" }} className="help">
                Pilih kategori produk
              </p>
            </div>
            <div className="field">
              <label style={{ color: "yellow" }} className="label">
                Product Price
              </label>
              <div className="control has-icons-left">
                <input
                  className="input"
                  type="number"
                  placeholder=""
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <span className="icon is-small is-left">Rp</span>
              </div>
              <p style={{ color: "white" }} className="help">
                Masukkan harga produk
              </p>
            </div>
            <div className="field">
              <label style={{ color: "white" }} className="label">
                Stock
              </label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  placeholder=""
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
              <p style={{ color: "white" }} className="help">
                Masukkan stok produk
              </p>
            </div>
            <div className="field">
              <label style={{ color: "white" }} className="label">
                Isi Stock Dalam 1 Dus
              </label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  placeholder=""
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
              <p style={{ color: "white" }} className="help">
                Masukkan isi dalam 1 dus (jika ada)
              </p>
            </div>
            <div className="field">
              <label style={{ color: "white" }} className="label">
                Isi Stock Dalam 1 Pack
              </label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  placeholder=""
                  value={unitPack}
                  onChange={(e) => setUnitPack(e.target.value)}
                />
              </div>
              <p style={{ color: "white" }} className="help">
                Masukkan isi dalam 1 pack (jika ada)
              </p>
            </div>
            <div className="field">
              <label style={{ color: "yellow" }} className="label">
                Capital Price
              </label>
              <div className="control has-icons-left">
                <input
                  className="input"
                  type="number"
                  placeholder=""
                  value={capitalPrice}
                  onChange={(e) => setCapitalPrice(e.target.value)}
                />
                <span className="icon is-small is-left">Rp</span>
              </div>
              <p style={{ color: "white" }} className="help">
                Masukkan harga modal
              </p>
            </div>
            <div className="field">
              <label style={{ color: "white" }} className="label">
                Discount
              </label>
              <div className="control has-icons-right">
                <input
                  className="input"
                  type="number"
                  placeholder=""
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
                <span className="icon is-small is-right">%</span>
              </div>
              <p style={{ color: "white" }} className="help">
                Tambahkan diskon (jika perlu)
              </p>
            </div>
            <button type="submit" className="button is-success is-fullwidth">
              Add
            </button>
          </form>
        </div>

        {/* form tambah stock */}
        <div
          onClick={handleHideFormAddStock}
          className={`formAddStock ${hideFormAddStock}`}
        >
          <form onSubmit={addstock} onClick={stopPropagation}>
            <h1 style={{ color: "white" }} className="label stockNameInfo">
              {nameAddStock.toUpperCase()}
            </h1>
            <div className="field">
              <h1 style={{ color: "white" }} className="label">
                Current Stock: {stockAddStock}
              </h1>
              <div className="control is-flex has-icons-left">
                <input type="hidden" className="input" value={codeAddStock} />
                <input
                  type="number"
                  className="input"
                  value={totalAddStock}
                  onChange={(e) => setTotalAddStock(e.target.value)}
                />
                <span className="icon is-left is-small">+</span>
                <button type="submit" className="button ml-3 is-primary">
                  Add Stock
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
