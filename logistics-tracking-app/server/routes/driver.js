import { Router } from "express";
import { authenticateToken } from '../middleware/auth.js';
import { redisClient } from '../server.js';

const router = Router();

// Update driver location (called from driver's mobile app/GPS)
router.post("/UpdateDriverLocation", authenticateToken, async (req, res) => {
    try {
        const { driverId, longitude, latitude } = req.body;
        if (!driverId || longitude == null || latitude == null) {
            return res.status(400).json({ message: "Missing fields" });
        }
        // Redis GEOADD: longitude comes before latitude!
        await redisClient.geoAdd("drivers", {
            longitude: parseFloat(longitude),
            latitude: parseFloat(latitude),
            member: driverId
        });

        res.json({ 
            message: "Driver location updated",
            driverId,
            location: { longitude, latitude }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not update driver location" });
    }
});

// Get all driver locations within radius of warehouse
router.get("/GetDriverLocations", authenticateToken, async (req, res) => {
    try {
        // GEORADIUS syntax: key longitude latitude radius unit [WITHCOORD]
        // Fixed: longitude (18.42) comes BEFORE latitude (-33.92)
        const drivers = await redisClient.sendCommand([
            "GEORADIUS",
            "drivers",
            "18.42",      // warehouse longitude (X coordinate)
            "-33.92",     // warehouse latitude (Y coordinate)
            "100",        // radius
            "km",
            "WITHCOORD"
        ]);

        // Format response: drivers is array of [member, [lon, lat]]
        const formatted = drivers.map((item) => {
            const member = item[0];
            const coords = item[1]; // [longitude, latitude]
            
            return {
                member,
                coordinates: [parseFloat(coords[0]), parseFloat(coords[1])]
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not fetch driver locations" });
    }
});

// Get specific driver location
router.get("/GetDriverLocation/:driverId", authenticateToken, async (req, res) => {
    try {
        const { driverId } = req.params;
        
        const position = await redisClient.geoPos("drivers", driverId);
        
        if (!position || !position[0]) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.json({
            driverId,
            coordinates: [
                parseFloat(position[0].longitude),
                parseFloat(position[0].latitude)
            ]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not fetch driver location" });
    }
});

// Calculate distance between driver and location
router.post("/CalculateDistance", authenticateToken, async (req, res) => {
    try {
        const { driverId, targetLongitude, targetLatitude } = req.body;
        
        // Add temporary location to calculate distance
        await redisClient.geoAdd("drivers", {
            longitude: parseFloat(targetLongitude),
            latitude: parseFloat(targetLatitude),
            member: "temp_target"
        });

        // Calculate distance
        const distance = await redisClient.geoDist(
            "drivers",
            driverId,
            "temp_target",
            "km"
        );

        // Clean up
        await redisClient.zRem("drivers", "temp_target");

        res.json({
            driverId,
            distance: distance ? parseFloat(distance) : null,
            unit: "km"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not calculate distance" });
    }
});

// Remove driver (when they go offline)
router.delete("/RemoveDriver/:driverId", authenticateToken, async (req, res) => {
    try {
        const { driverId } = req.params;
        await redisClient.zRem("drivers", driverId);
        res.json({ message: "Driver removed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not remove driver" });
    }
});

export default router;
