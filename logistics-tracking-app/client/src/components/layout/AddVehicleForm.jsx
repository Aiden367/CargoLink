import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Input } from '../common/Input'
import '../../styles/AddVehicleForm.css';

const AddVehicle = () => {

    const [VIN, setVIN] = useState('')
    const [name, setName] = useState('')
    const [type, setType] = useState('')
    const [year, setYear] = useState('')
    const [make, setMake] = useState('')
    const [model, setModel] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        const vehicleData = { VIN, name, type, year, make, model }
        try {
            const response = await axios.post('http://localhost:5000/vehicles/AddVehicle', vehicleData)
            console.log(response.data)
        } catch (err) {
            console.log("Could not save vehicle")
        }
    }
    
    return (
        <form className="add-vehicle-input-form" onSubmit={handleSubmit}>
            <div className="inputs-grid">
                <div className="input-group">
                    <label htmlFor="vin">VIN</label>
                    <input className="add-vehicle-input"
                        id="vin"
                        type="text"
                        value={VIN}
                        onChange={(e) => setVIN(e.target.value)}
                        placeholder="VIN"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="name">Name</label>
                    <input className="add-vehicle-input"
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="type">Type</label>
                    <input className="add-vehicle-input"
                        id="type"
                        type="text"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        placeholder="Type"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="year">Year</label>
                    <input className="add-vehicle-input"
                        id="year"
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="Year"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="make">Make</label>
                    <input className="add-vehicle-input"
                        id="make"
                        type="text"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="Make"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="model">Model</label>
                    <input className="add-vehicle-input"
                        id="model"
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Model"
                    />
                </div>
            </div>

            <button type="submit">Add Vehicle</button>
        </form>
    )
}

export default AddVehicle;