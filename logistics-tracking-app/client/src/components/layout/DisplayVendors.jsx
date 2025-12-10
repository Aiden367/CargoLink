import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Activity from '../common/Activity';
const DisplayVendors = ({ vendors }) => {
    return (
        <div>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Vendor ID </th>
                            <th> Shop Name</th>
                            <th> Shop Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendors.map(vendor => (
                            <tr key={vendor.vendorId}>
                                <td>{vendor.vendorId}</td>
                                <td>{vendor.shopName}</td>
                                <td>{vendor.location.latitude}</td>
                                <td>{vendor.location.longitude}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default DisplayVendors