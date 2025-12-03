import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import  Navbar  from '../components/layout/navbar.jsx';

const Home = () =>{
    return (
        <div>
            <Navbar/>
            <p>Home Page !!!</p>
        </div>
    )
}
export default Home;