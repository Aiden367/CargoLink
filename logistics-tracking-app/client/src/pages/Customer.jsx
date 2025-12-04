import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../components/common/Input'
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import CustomerList from '../components/layout/DisplayCustomers'
const Customer = () => {
    const[shopName,setShopName] = useState('')
    const[customerId,setCustomerId] = useState('')
    const[longitude,setLongitude] = useState('')
    const[latitude,setLatitude] = useState('')
    const[customerList,setCustomerList] = useState([])

    const displayAllCustomer = async (e) =>{
        try{
         const response = await axios.get("http://localhost:5000/customer/GetAllCustomers")
         setCustomerList(response.data)
        }catch(err){
            console.log(err)
        }
    }
    const handleSubmit = async (e) =>{
        e.preventDefault();
        const customerData = {shopName,longitude: parseFloat(longitude),latitude:parseFloat(latitude)}
        try{
          const response = await axios.post("http://localhost:5000/customer/AddCustomer",customerData)
          console.log("Customer added",response.data)
        }catch(err){
            console.log("Could submit data")
            console.error(err)
        }
    }
    return(
        <div>
            <div>
                <form onSubmit={handleSubmit}>
                    <Input
                     label = "shopName"
                     type= "text"
                     value= {shopName}
                     onChange={(e) => setShopName(e.target.value)}
                     placeholder="Shop Name"
                    />
                    <Input
                    label = "latitude"
                    type = "number"
                    value= {latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Latitude"
                    />
                    <Input
                    label ="longitude"
                    type="number"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Longitude"
                    />
                   <button type="submit" >Create Order </button>
                </form>

                <CustomerList customers={customerList} onRefresh={displayAllCustomer}/>
                
            </div>
        </div>
    )
}

export default Customer 