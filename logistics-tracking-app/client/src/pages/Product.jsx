
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import ProductList from '../components/layout/DisplayProducts'
import AddProductForm from '../components/layout/AddProductForm';
import Navbar from '../components/layout/navbar.jsx';

const Product = () => {
    const [productList, setProductList] = useState([])
    const recieveProducts = async (e) => {
        try {
            const response = await axios.get('http://localhost:5000/product/GetProducts')
            setProductList(response.data.listOfProducts)
            console.log(response.data)
        } catch (err) {
            console.log("Could not get products")
            console.err(err)
        }
    }
    useEffect(() => {
       recieveProducts();
    }, [])
    return (
        <div>
            <Navbar />
            <AddProductForm />
            <ProductList products={productList} />
        </div>
    )
}

export default Product