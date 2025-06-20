import React from "react";
import { useState } from "react";
import "../css/LoginPage.css";
import abLogo from "../assets/img/ab.png";
import CIcon from "@coreui/icons-react";
import { cilUser, cilHttps, cilShieldAlt } from "@coreui/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import SpinnerLoader from "./SpinnerLoader";
import outletBackground from "../assets/img/outletBackground.jpeg";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authCheck, setAuthCheck] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "AB FROZEN | Login";
    checkIsLoggedIn();
  }, []);

  const checkIsLoggedIn = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASEURL}/login`);
      if (response.status == 200) {
        setIsLoggedIn(true);
        navigate("/");
      }
    } catch (error) {
      console.log(error.response.data.msg);
      setIsLoggedIn(false);
    } finally {
      setAuthCheck(false);
    }
  };

  const login = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BASEURL}/login`,
        {
          username: username,
          password: password,
        }
      );

      console.log(response)
      if (response) {
        navigate("/");
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      setMsg(error.response.data.msg);
    }
  };

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
        <SpinnerLoader color={"white"} width={"100px"} />
      </div>
    );
  }

  if (isLoggedIn) {
    return null;
  }

  return (
    <div
      className="my-container"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="loginBox">
        <div className="loginLogo">
          <img src={abLogo} alt="logo" style={{ filter: "invert(1)" }} />
          <p>AB FROZEN GROSIR</p>
        </div>
        <div className="loginForm">
          <i className="shield-login">
            <CIcon icon={cilShieldAlt} />
          </i>
          <h1
            style={{
              color: "black",
              position: "absolute",
              marginTop: "-30px",
              fontWeight: "bold",
            }}
          >
            Selamat Datang...
          </h1>
          <form action="">
            <div className="field">
              <label className="label has-text-black">Username</label>
              <div className="control has-icons-left">
                <input
                  className="input is-fullwidth has-background-white has-text-black"
                  type="email"
                  placeholder=""
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <span className="icon is-small is-left">
                  <CIcon
                    icon={cilUser}
                    style={{
                      padding: "7px",
                      color: "hsla( 153deg , 53% , 53% , 1)",
                    }}
                    size="xxl"
                  />
                </span>
              </div>
              <p className="help has-text-black">Masukkan username</p>
            </div>
            <div className="field">
              <label className="label has-text-black">Password</label>
              <div className="control has-icons-left">
                <input
                  className="input is-fullwidth has-background-white has-text-black"
                  type="password"
                  placeholder="********"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="icon is-small is-left">
                  <CIcon
                    icon={cilHttps}
                    style={{
                      padding: "7px",
                      color: "hsla( 153deg , 53% , 53% , 1)",
                    }}
                    size="xxl"
                  />
                </span>
              </div>
              <p className="help has-text-black">Masukkan password</p>
            </div>
            <div className="field">
              <div className="control">
                <button
                  onClick={login}
                  className="button is-fullwidth"
                  style={{ height: "50px" }}
                >
                  {isLoading ? <SpinnerLoader color={"white"} /> : "MASUK"}
                </button>
              </div>
            </div>
            <p className="is-center">{msg}</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
