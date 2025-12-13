import { Router } from "express";
import Customer from '../models/customer.js'
import { authenticateToken } from '../middleware/auth.js'
import { getCustomer } from '../middleware/recieveCustomer.js'
import { createClient } from 'redis';
import { redisClient } from '../server.js';


const DEFAULT_EXPERIRATION = 3600
const router = Router();

// Add this: Store customer location in Redis for faster queries
router.post('/AddCustomer', authenticateToken, async (req, res) => {
    try {
        const { shopName, longitude, latitude, address } = req.body;
        if (!shopName || longitude == null || latitude == null) {
            return res.status(400).json({ message: "Fields are missing" });
        }
        const customer = new Customer({
            shopName,
            location: {
                type: "Point",
                coordinates: [longitude, latitude]
            },
            address
        });
        const newCustomer = await customer.save();
        await redisClient.geoAdd("customers", {
            longitude: parseFloat(longitude),
            latitude: parseFloat(latitude),
            member: newCustomer._id.toString()
        });
        await redisClient.del("customers");
        res.status(201).json(newCustomer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not save customer", error: err.message });
    }
});

router.get('/GetAllCustomers', authenticateToken, async (req, res) => {
    try {
        const cached = await redisClient.get('customers');
        if (cached != null) {
            console.log("Returning customers from redis ( Cache Hit)");
            return res.json(JSON.parse(cached));
        }
        const customer = await Customer.find();
        if (customer.length === 0) {
            return res.status(401).json({ message: "List of customers are empty" });
        }
        await redisClient.setEx(
            'customers',
            DEFAULT_EXPERIRATION,
            JSON.stringify(customer)
        );
        res.json(customer);
    } catch (err) {
        res.status(500).json({
            message: "Could not receive customers",
            error: err.message
        });
    }
});

router.patch('/EditCustomer', authenticateToken, getCustomer, async (req, res) => {
    try {
        const customer = req.customer;
        const { longitude, latitude } = req.body;
        if (longitude && latitude) {
            customer.location = {
                type: "Point",
                coordinates: [longitude, latitude]
            };
        }
        await customer.save();
        res.status(200).json({
            message: "Customer updated successfully",
            customer
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});





export default router;