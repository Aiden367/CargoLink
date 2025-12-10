import AddVehicleForm from '../components/layout/AddVehicleForm';
import DisplayVehicles from '../components/layout/DisplayVehicles';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/navbar.jsx';
import '../styles/VehiclesPage.css';
const Vehicles = () => {

    const [listOfVehicles, setListOfVehicles] = useState([])

    const retrieveVehicles = async (e) => {
        try {
            const response = await axios.get('http://localhost:5000/vehicles/GetAllVehicles')
            setListOfVehicles(response.data)
        } catch (err) {
            console.err(err);
        }
    }
    useEffect(() => {
        retrieveVehicles();
    }, []);
    return (
        <div className= "vehicles-container">
            <Navbar/>
            <div className ="vehicle-heading">
                <h1>Vendors</h1>
                <button >Add Vendors</button>
            </div>
            <AddVehicleForm />
            <DisplayVehicles vehicles={listOfVehicles} />
        </div>
    )
}

export default Vehicles; 