import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import axios from 'axios'
axios.defaults.withCredentials = true
import './index.css'
import 'bulma/css/bulma.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
