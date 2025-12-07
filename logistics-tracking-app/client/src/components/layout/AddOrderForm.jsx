
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../common/Input'
import axios from 'axios';

const AddOrder = () => {
    const [driverId, setDriverId] = useState('')
    const [customerId, setCustomerId] = useState('')
    const [shipmentDetails, setShipmentDetails] = useState('')
    const [status, setStatus] = useState('')
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const orderData = { driverId, customerId, shipmentDetails, status }
            if (orderData == null) {
                return console.log("order data is empty")
            }
            const response = await axios.post("http://localhost:5000/order/CreateOrder", orderData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })
            console.log("Order succesfully completed", response.data)
        } catch (err) {
            console.log("Could not save order data")
            console.error(err);
        }
    }

    return (
        <div>
            <div>
                <form onSubmit={handleSubmit}>
                    <Input
                     label = "driverId"
                     type = "text"
                     value = {driverId}
                     onChange={(e) => setDriverId(e.target.value)}
                     placeholder= "Driver ID"
                    />
                    <Input
                     label = "customerId"
                     type = "text"
                     value = {customerId}
                     onChange={(e) => setCustomerId(e.target.value)}
                     placeholder = "Customer ID"
                    />
                    <Input
                     label = "shipmentDetail"
                     type = "text"
                     value = {shipmentDetails}
                     onChange={(e) => setShipmentDetails(e.target.value)}
                     placeholder= "Shipment Detail"
                    />
                    <Input
                    label = "status"
                    type = "text"
                    value = {status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder= "Status"
                    />
                    <button>Add Order</button>
                </form>
            </div>
        </div>
    )
}

export default AddOrder;