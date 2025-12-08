
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Input } from '../common/Input'
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
        <div>
            <div>
                <form onSubmit={handleSubmit}>
                    <Input
                        label="productName"
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Product Name"
                    />
                    <Input
                        label="productAmount"
                        type="text"
                        value={productName}
                        onChange={(e) => setProductAmount(e.target.value)}
                        placeholder="Product Amount"
                    />
                    <Input
                        label="productCost"
                        type="text"
                        value={productCost}
                        onChange={(e) => setProductCost(e.target.value)}
                        placeholder="Product Cost"
                    />
                    <button type="submit">Add Product</button>
                </form>
            </div>
        </div>
    )
}

export default AddProduct