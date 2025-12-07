import { Router } from "express";

import { authenticateToken } from '../middleware/auth.js'
import { getCustomer } from '../middleware/recieveCustomer.js'
import { createClient } from 'redis';
import { redisClient } from '../server.js';
import Driver from '../models/customer.js'

const router = Router()


router.post("/UpdateDriverLocation", authenticateToken, async (req, res) => {
    try {
        const { driverId, longitude, latitude } = req.body;
        if (!driverId || longitude == null || latitude == null){
            return res.status(400).json({ message: "Missing fields" });
        }
        await redisClient.geoAdd("drivers", {
            longitude,
            latitude,
            member: driverId
        });

        res.json({ message: "Driver location updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not update driver location" });
    }
});


router.get("/GetDriverLocations", authenticateToken, async (req, res) => {
    try {
        // Get all drivers within 100 km radius of warehouse (or all)
        const drivers = await redisClient.sendCommand([
            "GEORADIUS",
            "drivers",
            "18.42",    // warehouse longitude
            "-33.92",   // warehouse latitude
            "1000",     // radius in km
            "km",
            "WITHCOORD"
        ]);

        // Format response
        const formatted = drivers.map(([member, distance, [lon, lat]]) => ({
            member,
            coordinates: [parseFloat(lon), parseFloat(lat)],
        }));

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not fetch driver locations" });
    }
});


export default router;