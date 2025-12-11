
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import VendorList from '../components/layout/DisplayVendors'
import AddVendorForm from '../components/layout/AddVendorForm';
import Navbar from '../components/layout/navbar.jsx';
import SearchForVendors from '../components/layout/SearchForVendors';

const Vendor = () => {
    const [listOfVendors, setListOfVendors] = useState([])
    const [listOfSearchedVendor, setListOfSearchedVendor] = useState([])
    const [searchedVendorId, setSearchedVendorId] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const navigate = useNavigate();
    const displayVendors = async (e) => {
        try {
            const response = await axios.get('http://localhost:5000/vendor/GetVendors')
            if (response == null) {
                return console.log("There are no vendors saved")
            }
            setListOfVendors(response.data)
            console.log(response.data)
        } catch (err) {
            console.log("Could not recieve vendors")
            console.err(err)
        }
    }

    const handleSearchForVendor = async (e) => {
        e.preventDefault();
        const response = await axios.get(`http://localhost:5000/vendor/FindVendor/${searchedVendorId}`)
        setListOfSearchedVendor([response.data]);
        setIsSearching(true);
        console.log("Vendor found:", response.data);
    }

    // Watch for empty search input and reset
    useEffect(() => {
        if (searchedVendorId.trim() === '') {
            setIsSearching(false);
            setListOfSearchedVendor([]);
        }
    }, [searchedVendorId]);

    useEffect(() => {
        displayVendors();
    }, []);
    return (
        <>
            <Navbar />
            <div>
                <div>
                    <div className="search-for-vehicle">
                        <form onSubmit={handleSearchForVendor}>
                            <input
                                type="text"
                                value={searchedVendorId}
                                onChange={(e) => setSearchedVendorId(e.target.value)}
                                placeholder="Search by Vendor ID"
                            />
                        </form>
                        {isSearching ? (
                            <div className="table-container">
                                <SearchForVendors vendors={listOfSearchedVendor} />
                            </div>
                        ) : (
                            <div className="table-container">
                                <VendorList vendors={listOfVendors} />
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </>
    )
}

export default Vendor;  