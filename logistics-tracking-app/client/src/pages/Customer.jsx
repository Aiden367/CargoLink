import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../components/common/Input'
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import CustomerList from '../components/layout/DisplayCustomers'
import AddCustomerForm from '../components/layout/AddCustomerForm';
import  Navbar  from '../components/layout/navbar.jsx';
const Customer = () => {
    const[customerList,setCustomerList] = useState([])
    
    const displayAllCustomer = async (e) =>{
        try{
        const response= await axios.get('http://localhost:5000/customer/GetAllCustomers',{
            headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
        })
        setCustomerList(response.data)
        }catch(err){
            console.log(err)
        }
    }
    return(
        <div>
            <div>
                <Navbar/>
                <AddCustomerForm/>
                <CustomerList customers={customerList} onRefresh={displayAllCustomer}/>
            </div>
        </div>
    )
}

export default Customer 