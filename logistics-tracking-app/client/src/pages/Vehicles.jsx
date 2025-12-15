import AddVehicleForm from '../components/layout/AddVehicleForm';
import DisplayVehicles from '../components/layout/DisplayVehicles';
import SearchForVehicles from '../components/layout/SearchForVehicles';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/navbar.jsx';
import '../styles/VehiclesPage.css';
import { useNavigate } from "react-router-dom";
const Vehicles = () => {

    const [listOfVehicles, setListOfVehicles] = useState([])
    const [listOfSearchedVehicle, setListOfSearchedVehicle] = useState([])
    const [searchedVehicleId, setSearchedVehicleId] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const navigate = useNavigate();
    const retrieveVehicles = async (e) => {
        try {
            const response = await axios.get('http://localhost:5000/vehicles/GetAllVehicles', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })
            setListOfVehicles(response.data)
        } catch (err) {
            console.err(err);
        }
    }
    const handleSearchingForVehicle = async (e) => {
        try {
            e.preventDefault();
            const response = await axios.get(`http://localhost:5000/vehicles/SearchForVehicle/${searchedVehicleId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })
            setListOfSearchedVehicle([response.data]);
            setIsSearching(true);
            console.log("Vehicle found:", response.data);
        } catch (err) {
            console.log("error searching for vehicle", err)
            setListOfSearchedVehicle([]); // Clear on error
        }
    }

    const navigateToAddVehicle = async (e) => {
        navigate('/addvehicles')
    }

    // Watch for empty search input and reset
    useEffect(() => {
        if (searchedVehicleId.trim() === '') {
            setIsSearching(false);
            setListOfSearchedVehicle([]);
        }
    }, [searchedVehicleId]);

    useEffect(() => {
        retrieveVehicles();
    }, []);
    return (
        <>
            <Navbar />
            <div className="vehicles-container">
                <div className="vehicle-heading">
                    <h1 className="vehicle-heading-name">Vehicles</h1>
                    <button onClick={navigateToAddVehicle} className="add-vehicle-button">Add Vehicles</button>
                </div>

                <div className="search-for-vehicle">
                    <form onSubmit={handleSearchingForVehicle}>
                        <input
                            type="text"
                            value={searchedVehicleId}
                            onChange={(e) => setSearchedVehicleId(e.target.value)}
                            placeholder="Search by Vehicle ID"
                        />
                    </form>
                    {isSearching ? (
                        <div className="table-container">
                            <SearchForVehicles vehicles={listOfSearchedVehicle} />
                        </div>
                    ) : (
                        <div className="table-container">
                            <DisplayVehicles vehicles={listOfVehicles} />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Vehicles; 