import React, { useState } from 'react'
// import "../index.css";
import invocation from "../assets/img/invocation.jpeg"

const UpStorage = () => {
    const [isWarnShow, setIsWarnShow] = useState(false)

    const handleWarn = () => {
        setTimeout(() => {
            setIsWarnShow(true)

        }, 5000)
    }

    handleWarn()
  return (
    <div style={{width: "100%", display: "flex", flexDirection: "column", gap: "15px", justifyContent: "center", alignItems: "center", position: "absolute", height: "150vh", marginTop: "-200px", backgroundColor: "black", zIndex: isWarnShow ? "9999999" : "-9999999"}}>
        <h3 style={{width: "500px", textAlign: "center"}}>You have reached the maximum number of allowed invocations under your current subscription plan.</h3>
        <img src={invocation} alt="" style={{border: "3px solid lightblue", borderRadius: "10px"}} />
        <h3 style={{width: "500px", textAlign: "center"}}>To continue using the service without interruption, please review your subscription details and upgrade to a higher plan.</h3>
    </div>
  )
}

export default UpStorage