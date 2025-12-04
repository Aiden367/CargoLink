
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../components/common/Input'
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const Orders = () => {
    const [shipmentDetails, setShipmentDetails] = useState('')
    const [status, setStatus] = useState('')
    const [assignedDriver, setAssignedDriver] = useState('')
    const handleSubmit = async (e) => {
        e.preventDefault();
        const orderData = { shipmentDetails, status,assignedDriver }
        try {
            const response = await axios.post("http://localhost:5000/order/CreateOrder", orderData)
            console.log("Order Created", response.data)
        } catch (err) {
            console.log("Cannot save order")
            console.error(err);
        }
    }
    return (
        <div>
            <div>
                <form onSubmit={handleSubmit}>
                    <Input
                        label="shipmentDetails"
                        type="text"
                        value={(shipmentDetails)}
                        onChange={(e) => setShipmentDetails(e.target.value)}
                        placeholder="Shipment Details"
                    />
                    <Input
                        label="status"
                        type="text"
                        value={(status)}
                        onChange={(e) => setStatus(e.target.value)}
                        placeholder="Delivery Status"
                    />
                    <Input
                        label="assignedDriver"
                        type="text"
                        value={(assignedDriver)}
                        onChange={(e) => setAssignedDriver(e.target.value)}
                        placeholder="Assigned Driver"
                    />
                    <button type="submit" >Create Order </button>
                </form>
            </div>
        </div>
    )
}
export default Orders