
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Input } from '../common/Input'
import '../../styles/AddProductForm.css';
const AddProduct = () => {
    const [productName, setProductName] = useState('')
    const [productAmount, setProductAmount] = useState('')
    const [productCost, setProductCost] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const productData = { productName, productAmount, productCost }
            if (productData == null) {
                return console.log("Product data is empty")
            }
            const response = await axios.post('http://localhost:5000/product/AddProduct', productData)
            console.log("Product Added succesfully", response.data)
        } catch (err) {
            console.log("Error saving product")
            console.err(err)
        }

    }
     return (
        <form className="add-product-input-form" onSubmit={handleSubmit}>
            <div className="inputs-grid">
                <div className="input-group">
                    <label htmlFor="productName">Product Name</label>
                    <input className="add-product-input"
                        id="productName"
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Product Name"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="productAmount">Product Amount</label>
                    <input className="add-product-input"
                        id="productAmount"
                        type="text"
                        step="any"
                        value={productAmount}
                        onChange={(e) => setProductAmount(e.target.value)}
                        placeholder="Product Amount"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="productCost">Product Cost</label>
                    <input className="add-product-input"
                        id="productCost"
                        type="text"
                        step="any"
                        value={productCost}
                        onChange={(e) => setProductCost(e.target.value)}
                        placeholder="Longitude"
                    />
                </div>
            </div>
            <button type="submit">Add Product</button>
        </form>
    )
}

export default AddProduct