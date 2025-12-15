import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import '../../styles/AddProductForm.css';

const AddProduct = () => {
    const navigate = useNavigate();
    const [productName, setProductName] = useState('');
    const [productAmount, setProductAmount] = useState('');
    const [productCost, setProductCost] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const productData = { productName, productAmount, productCost };
        
        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('You must be logged in to add a product');
                setLoading(false);
                navigate('/login');
                return;
            }

            const response = await axios.post(
                'http://localhost:5000/product/AddProduct',
                productData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Product added successfully:', response.data);
            setProductName('');
            setProductAmount('');
            setProductCost('');
            alert('Product added successfully!');
        } catch (err) {
            console.error('Error adding product:', err);
            
            if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
                localStorage.removeItem('token');
                navigate('/login');
            } else if (err.response?.status === 403) {
                setError('You do not have permission to add products.');
            } else {
                setError(err.response?.data?.message || 'Could not save product');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="add-product-input-form" onSubmit={handleSubmit}>
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
                    <label htmlFor="productName">Product Name</label>
                    <input 
                        className="add-product-input"
                        id="productName"
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Product Name"
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="productAmount">Product Amount</label>
                    <input 
                        className="add-product-input"
                        id="productAmount"
                        type="number"
                        step="any"
                        value={productAmount}
                        onChange={(e) => setProductAmount(e.target.value)}
                        placeholder="Product Amount"
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="productCost">Product Cost</label>
                    <input 
                        className="add-product-input"
                        id="productCost"
                        type="number"
                        step="0.01"
                        value={productCost}
                        onChange={(e) => setProductCost(e.target.value)}
                        placeholder="Product Cost"
                        required
                    />
                </div>
            </div>
            
            <button type="submit" disabled={loading}>
                {loading ? 'Adding Product...' : 'Add Product'}
            </button>
        </form>
    );
};

export default AddProduct;