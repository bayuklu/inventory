import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Cashier from './components/Cashier'
import Inventory from './components/Inventory'
import Outlet from './components/Outlet'
import Orders from './components/Orders'
import LoginPage from './components/LoginPage'

function App() {
  return (
    // <div><Dashboard/></div>
    <>
   <Router> 
     <Routes>
       <Route path="/" element={<Dashboard/>}/>
       <Route path="/inventory" element={<Inventory/>}/>
       <Route path="/cashier" element={<Cashier/>}/>
       <Route path="/Outlet" element={<Outlet/>}/>
       <Route path="/orders" element={<Orders/>}/>
       <Route path="/login" element={<LoginPage/>}/>
     </Routes>
   </Router>
    </>
  )
}

export default App
