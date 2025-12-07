
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../components/common/Input'
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import AddOrderForm from '../components/layout/AddOrderForm';

const Orders = () => {
    return (
        <div>
            <AddOrderForm/>
        </div>
    )
}
export default Orders