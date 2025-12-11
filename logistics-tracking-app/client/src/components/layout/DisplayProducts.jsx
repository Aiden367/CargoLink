
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Activity from '../common/Activity';


const DisplayProduct = ({ products }) => {
    return (
        <div>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Product Name</th>
                            <th>Product Amount</th>
                            <th>Product Cost</th>
                            <th>Date Product Added</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product => (
                            <tr key={product.productId}>
                                <td> {product.productId}</td>
                                <td> {product.productName}</td>
                                <td>{product.productAmount}</td>
                                <td>{product.productCost}</td>
                                <td>{product.dateInventoryCreated}</td>
                            </tr>
                        )))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default DisplayProduct;
