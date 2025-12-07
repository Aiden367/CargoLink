import AddVehicleForm from '../components/layout/AddVehicleForm';
import DisplayVehicles from '../components/layout/DisplayVehicles';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
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
        <div>
            <AddVehicleForm />
            <DisplayVehicles vehicles={listOfVehicles} />
        </div>
    )
}

export default Vehicles; 