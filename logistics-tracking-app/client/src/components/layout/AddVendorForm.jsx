import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../common/Input'
import axios from 'axios';
import { useNavigate } from "react-router-dom";


const AddVendor = () => {
    const [shopName, setShopName] = useState('');
    const [latitude, setLatitude] = useState('')
    const [longitude, setLongitude] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const vendorData = { shopName, longitude: parseFloat(longitude), latitude: parseFloat(latitude) }
            if (vendorData == null) {
                return console.log("Vendor data is empty")
            }
            const response = await axios.post('http://localhost:5000/vendor/AddVendor', vendorData)
            console.log("Vendor sucessfully added", response.data)
        } catch (err) {
            console.log("Error saving vendor data")
            console.err(err);
        }
    }

    return (
        <div>
            <div>
                <form onSubmit={handleSubmit}>
                    <Input
                        label="shopName"
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="Shop Name"
                    />
                    <Input
                        label="latitude"
                        type="number"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="Latitude"
                    />
                    <Input
                        label="longitude"
                        type="number"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="Longitude"
                    />
                 <button type= "submit">Create Vendor</button>
                </form>
            </div>
        </div>
    )
}

export default AddVendor;