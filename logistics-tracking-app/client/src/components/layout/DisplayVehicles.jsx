import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Activity from '../common/Activity';


const DisplayVehicle = ({ vehicles }) => {
    return (
        <div>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>VIN</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Year</th>
                            <th>Make</th>
                            <th>Model</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map((vehicle) => (
                            <tr key={vehicle.vehicleId}>
                                <td> {vehicle.VIN}</td>
                                <td>{vehicle.name}</td>
                                <td>{vehicle.type}</td>
                                <td>{vehicle.year}</td>
                                <td>{vehicle.Make}</td>
                                <td>{vehicle.Model}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default DisplayVehicle;