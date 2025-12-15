import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../common/Input'
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import '../../styles/AddVendorForm.css';

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
            const response = await axios.post("http://localhost:5000/vendor/AddVendor", vendorData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })  
            console.log("Vendor sucessfully added", response.data)

           
        } catch (err) {
            console.log("Error saving vendor data")
            console.error(err);
        }
    }

    return (
        <form className="add-vendor-input-form" onSubmit={handleSubmit}>
            <div className="inputs-grid">
                <div className="input-group">
                    <label htmlFor="shopName">Shop Name</label>
                    <input className="add-vendor-input"
                        id="shopName"
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="Shop Name"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="latitude">Latitude</label>
                    <input className="add-vendor-input"
                        id="latitude"
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="Latitude"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="longitude">Longitude</label>
                    <input className="add-vendor-input"
                        id="longitude"
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="Longitude"
                    />
                </div>
            </div>

            <button type="submit">Create Vendor</button>
        </form>
    )
}

export default AddVendor;