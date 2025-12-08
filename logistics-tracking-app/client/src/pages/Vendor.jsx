
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import VendorList from '../components/layout/DisplayVendors'
import AddVendorForm from '../components/layout/AddVendorForm';
import Navbar from '../components/layout/navbar.jsx';


const Vendor = () => {
    const [listOfVendors, setListOfVendors] = useState([])
    const displayVendors = async (e) => {
        try {
            const response = await axios.get('http://localhost:5000/vendor/GetVendors')
            if (response == null) {
                return console.log("There are no vendors saved")
            }
            setListOfVendors(response.data)
        } catch (err) {
            console.log("Could not recieve vendors")
            console.err(err)
        }
    }
    useEffect(() => {
        displayVendors();
    }, []);
    return (
        <div>
            <Navbar />
            <AddVendorForm />
            <VendorList vendors={listOfVendors} />
        </div>
    )
}

export default Vendor;  