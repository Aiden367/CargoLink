
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import AddProductForm from '../components/layout/AddProductForm';
import Navbar from '../components/layout/navbar.jsx';
import DisplayProduct from '../components/layout/DisplayProducts';
import SearchForProducts from '../components/layout/SearchForProducts';
import '../styles/ProductPage.css';
const Product = () => {
    const [productList, setProductList] = useState([])
    const [listOfSearchedProduct, setListOfSearchedProduct] = useState([])
    const [searchedProductId, setSearchedProductId] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    const navigate = useNavigate()
    const recieveProducts = async (e) => {
        try {
            const response = await axios.get('http://localhost:5000/product/GetProducts')
            setProductList(response.data)
            console.log(response.data)
        } catch (err) {
            console.log("Could not get products")
            console.err(err)
        }
    }

    const handleSearchingForProduct = async (e) => {
        try {
            e.preventDefault();
            const response = await axios.get(`http://localhost:5000/product/FindProduct/${searchedProductId}`)
            setListOfSearchedProduct([response.data]);
            setIsSearching(true);
            console.log("Product Found", response.data);
        } catch (err) {
            console.log("error searching for product", err)
            setListOfSearchedProduct([]); // Clear on error
        }
    }

    const navigateToAddProduct = async (e) => {
        navigate('/addproduct')
    }

    // Watch for empty search input and reset
    useEffect(() => {
        if (searchedProductId.trim() === '') {
            setIsSearching(false);
            setListOfSearchedProduct([]);
        }
    }, [searchedProductId]);


    useEffect(() => {
        recieveProducts();
    }, [])
    return (
        <>
            <Navbar />
            <div className="product-container">
                <div className="product-heading">
                    <h1 className="product-heading-name">Products</h1>
                    <button onClick={navigateToAddProduct} className="add-product-button">Add Products</button>
                </div>

                <div className="search-for-product">
                    <form onSubmit={handleSearchingForProduct}>
                        <input
                            type="text"
                            value={searchedProductId}
                            onChange={(e) => setSearchedProductId(e.target.value)}
                            placeholder="Search by Product ID"
                        />
                    </form>
                    {isSearching ? (
                        <div className="table-container">
                            <SearchForProducts products={listOfSearchedProduct} />
                        </div>
                    ) : (
                        <div className="table-container">
                            <DisplayProduct products={productList} />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Product