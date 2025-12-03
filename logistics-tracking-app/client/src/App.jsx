import { useState } from 'react'

import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<RegisterPage/>} />
          <Route path="/Register" element={<RegisterPage/>} />
          <Route path="/Login" element={<LoginPage/>}/>
        </Routes>
      </Router>
    </>
  )
}

export default App
