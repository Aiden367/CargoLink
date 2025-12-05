import { useState } from 'react'

import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import HomePage from './pages/Home'
import OrderPage from './pages/Orders'
import CustomerPage from './pages/Customer'
function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/register" element={<RegisterPage/>} />
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/order" element = {<OrderPage/>}/>
           <Route path="/customer" element = {<CustomerPage/>}/>
            <Route path="/home" element = {<HomePage/>}/>
        </Routes>
      </Router>
    </>
  )
}

export default App
