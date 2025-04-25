import React from "react";
import "../index.css";
import axios from "axios";
import {useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate()

  const handleLogout = async() => {
    try {
      const response = await axios.delete(`${import.meta.env.VITE_BASEURL}/logout`)
      if(response) navigate("/login")
    } catch (error) {
      console.log(error.response)
    }
  }
  return (
    <div className="my-sidebar">
      <aside className="menu">
        <p className="menu-label">Admin</p>
        <ul className="menu-list">
          <li className="mb-1">
            <a href="/">Dashboard</a>
          </li>
          <li className="mb-1">
            <a href="/inventory">Inventory</a>
          </li>
          <li>
            <a href="/outlet">Outlet</a>
          </li>
        </ul>
        <p className="menu-label">Transaction</p>
        <ul className="menu-list">
          <li>
            <a href="cashier">Cashier</a>
          </li>
        </ul>
        <ul>
          <li>
            <a href="#" onClick={handleLogout}>Log Out</a>
          </li>
        </ul>
      </aside>
    </div>
  );
};

export default Sidebar;
