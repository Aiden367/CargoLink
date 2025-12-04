
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const DisplayCustomers = ({customers, onRefresh}) => {
    return(
        <div>
            <button onClick={(onRefresh)}>Display customers</button>
            <table>
             <thead>
                <tr>Customer ID</tr>
                <tr>Shop Name</tr>
                <tr> Shop Location</tr>
             </thead>
            <tbody>
                {customers.map(customer => (
                    <tr key = {customer.customerId}>
                        <td>{customer.customerId}</td>
                        <td>{customer.shopName}</td>
                        <td>{customer.location.latitude}</td>
                        <td>{customer.location.longitude}</td>
                    </tr>
                ))}
            </tbody>
         
            </table>
       
        </div>
    )
}

export default DisplayCustomers