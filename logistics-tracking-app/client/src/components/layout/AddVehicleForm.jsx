import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Input } from '../common/Input'

const AddVehicle = () => {

    const [VIN, setVIN] = useState('')
    const [name, setName] = useState('')
    const [type, setType] = useState('')
    const [year, setYear] = useState('')
    const [make, setMake] = useState('')
    const [model, setModel] = useState('')

    const handleSubmit = async (e) =>{
        e.preventDefault()
     const vehicleData = {VIN,name,type,year,make,model}
     try{
       const response = await axios.post('http://localhost:5000/vehicles/AddVehicle',vehicleData)
       console.log(response.data)
     }catch(err){
        console.log("Could not save vehicle")
     }
    }
    return (
        <div>
            <div>
                <form onSubmit= {handleSubmit}>
                    <Input
                        label="VIN"
                        type="text"
                        value={VIN}
                        onChange={(e) => setVIN(e.target.value)}
                        placeholder="VIN"
                    />
                    <Input
                        label="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                    />
                    <Input
                        label="type"
                        type="text"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        placeholder="Type"
                    />
                    <Input
                        label="year"
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="Year"
                    />
                    <Input
                        label="make"
                        type="text"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="Make"
                    />
                    <Input
                        label="model"
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Model"
                    />
                    <button type="submit" >Add Vehicle</button>
                </form>
            </div>
        </div>
    )
}

export default AddVehicle; 