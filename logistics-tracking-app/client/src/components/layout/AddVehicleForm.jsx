import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import '../../styles/AddVehicleForm.css';

const AddVehicle = () => {
    const navigate = useNavigate();
    const [VIN, setVIN] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [year, setYear] = useState('');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const vehicleData = { VIN, name, type, year, make, model };
        
        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('You must be logged in to add a vehicle');
                setLoading(false);
                navigate('/login');
                return;
            }

            const response = await axios.post(
                'http://localhost:5000/vehicles/AddVehicle',
                vehicleData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })
            console.log('Vehicle added successfully:', response.data);
            // Clear form
            setVIN('');
            setName('');
            setType('');
            setYear('');
            setMake('');
            setModel('');
            
            // Optional: Show success message or redirect
            alert('Vehicle added successfully!');
            
        } catch (err) {
            console.error('Error adding vehicle:', err);
            
            if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
                localStorage.removeItem('token');
                navigate('/login');
            } else if (err.response?.status === 403) {
                setError('You do not have permission to add vehicles.');
            } else {
                setError(err.response?.data?.message || 'Could not save vehicle');
            }
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form className="add-vehicle-input-form" onSubmit={handleSubmit}>
            {error && (
                <div style={{ 
                    color: 'red', 
                    marginBottom: '1rem', 
                    padding: '0.5rem', 
                    border: '1px solid red',
                    borderRadius: '4px'
                }}>
                    {error}
                </div>
            )}

            <div className="inputs-grid">
                <div className="input-group">
                    <label htmlFor="vin">VIN</label>
                    <input 
                        className="add-vehicle-input"
                        id="vin"
                        type="text"
                        value={VIN}
                        onChange={(e) => setVIN(e.target.value)}
                        placeholder="VIN"
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="name">Name</label>
                    <input 
                        className="add-vehicle-input"
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="type">Type</label>
                    <input 
                        className="add-vehicle-input"
                        id="type"
                        type="text"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        placeholder="Type"
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="year">Year</label>
                    <input 
                        className="add-vehicle-input"
                        id="year"
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="Year"
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="make">Make</label>
                    <input 
                        className="add-vehicle-input"
                        id="make"
                        type="text"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="Make"
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="model">Model</label>
                    <input 
                        className="add-vehicle-input"
                        id="model"
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Model"
                        required
                    />
                </div>
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
            </button>
        </form>
    );
};

export default AddVehicle;