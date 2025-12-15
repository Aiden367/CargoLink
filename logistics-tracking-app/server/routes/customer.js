import { Router } from "express";
import Customer from '../models/customer.js'
import { authenticateToken } from '../middleware/auth.js'
import { getCustomer } from '../middleware/recieveCustomer.js'
import { redisClient } from '../server.js';

const DEFAULT_EXPERIRATION = 3600
const router = Router();

router.post('/AddCustomer', authenticateToken, async (req, res) => {
    try {
        const { shopName, longitude, latitude, address } = req.body;

        if (!shopName || longitude == null || latitude == null) {
            return res.status(400).json({ message: "Fields are missing" });
        }

        if (!req.user?.id) {
            return res.status(401).json({ message: "Invalid token" });
        }

        const customer = new Customer({
            userId: req.user.id,
            shopName,
            location: {
                type: "Point",
                coordinates: [longitude, latitude]
            },
            address
        });

        const newCustomer = await customer.save();

        // ✅ GEO data
        await redisClient.geoAdd("customers:geo", {
            longitude: parseFloat(longitude),
            latitude: parseFloat(latitude),
            member: newCustomer._id.toString()
        });

        // ✅ invalidate ONLY the cache
        await redisClient.del("customers:cache");

        res.status(201).json(newCustomer);

    } catch (err) {
        console.error("ADD CUSTOMER ERROR:", err);
        res.status(500).json({
            message: "Could not save customer",
            error: err.message
        });
    }
});


router.get('/GetAllCustomers', authenticateToken, async (req, res) => {
    try {
        const cached = await redisClient.get('customers');
        if (cached != null) {
            console.log("Returning customers from redis (Cache Hit)");
            return res.json(JSON.parse(cached));
        }
        const customer = await Customer.find().populate('userId', 'username email firstName lastName');
        if (customer.length === 0) {
            return res.status(404).json({ message: "List of customers are empty" });
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
        
        // Verify the customer belongs to the authenticated user
        if (customer.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized to edit this customer" });
        }

        const { shopName, longitude, latitude, address } = req.body;
        
        if (shopName) customer.shopName = shopName;
        if (address) customer.address = address;
        
        if (longitude && latitude) {
            customer.location = {
                type: "Point",
                coordinates: [longitude, latitude]
            };
            
            // Update Redis geospatial data
            await redisClient.geoAdd("customers", {
                longitude: parseFloat(longitude),
                latitude: parseFloat(latitude),
                member: customer._id.toString()
            });
        }
        
        await customer.save();
        await redisClient.del("customers"); // Invalidate cache
        
        res.status(200).json({
            message: "Customer updated successfully",
            customer
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;