
import { Router } from "express";
import { authenticateToken } from '../middleware/auth.js';
import { redisClient } from '../server.js';

const router = Router();
const DEFAULT_EXPIRATION = 3600;

// Add new driver to database
router.post("/AddDriver", authenticateToken, async (req, res) => {
    try {
        const { name, phoneNumber, VehicleId } = req.body;
        
        if (!name || !phoneNumber) {
            return res.status(400).json({ message: "Name and phone number are required" });
        }

        const newDriver = new Driver({
            name,
            phoneNumber,
            VehicleId: VehicleId || null
        });

        const savedDriver = await newDriver.save();
        
        // Clear Redis cache
        await redisClient.del("drivers_list");
        
        res.status(201).json({
            message: "Driver added successfully",
            driver: savedDriver
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not add driver", error: err.message });
    }
});

// Get all drivers from database
router.get("/GetAllDrivers", authenticateToken, async (req, res) => {
    try {
        // Check cache first
        const cached = await redisClient.get('drivers_list');
        if (cached != null) {
            return res.json(JSON.parse(cached));
        }

        const drivers = await Driver.find();
        
        if (drivers.length === 0) {
            return res.status(404).json({ message: "No drivers found" });
        }

        // Cache for 1 hour
        await redisClient.setEx(
            'drivers_list',
            DEFAULT_EXPIRATION,
            JSON.stringify(drivers)
        );

        res.json(drivers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not retrieve drivers", error: err.message });
    }
});

// Update driver location (called from driver's mobile app/GPS)
router.post("/UpdateDriverLocation", authenticateToken, async (req, res) => {
    try {
        const { driverId, longitude, latitude } = req.body;
        if (!driverId || longitude == null || latitude == null) {
            return res.status(400).json({ message: "Missing fields" });
        }
        
        // Verify driver exists in database
        const driver = await Driver.findOne({ DriverId: driverId });
        if (!driver) {
            return res.status(404).json({ message: "Driver not found in database" });
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
            driverName: driver.name,
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
        const drivers = await redisClient.sendCommand([
            "GEORADIUS",
            "drivers",
            "18.42",      // warehouse longitude
            "-33.92",     // warehouse latitude
            "100",        // radius
            "km",
            "WITHCOORD"
        ]);

        const formatted = drivers.map((item) => {
            const member = item[0];
            const coords = item[1];
            
            return {
                driverId: member,
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
            return res.status(404).json({ message: "Driver not found or offline" });
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

// Get driver info by ID
router.get("/GetDriver/:driverId", authenticateToken, async (req, res) => {
    try {
        const { driverId } = req.params;
        const driver = await Driver.findOne({ DriverId: driverId });
        
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.json(driver);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not fetch driver" });
    }
});

// Calculate distance between driver and location
router.post("/CalculateDistance", authenticateToken, async (req, res) => {
    try {
        const { driverId, targetLongitude, targetLatitude } = req.body;
        
        await redisClient.geoAdd("drivers", {
            longitude: parseFloat(targetLongitude),
            latitude: parseFloat(targetLatitude),
            member: "temp_target"
        });

        const distance = await redisClient.geoDist(
            "drivers",
            driverId,
            "temp_target",
            "km"
        );

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
        res.json({ message: "Driver removed from active pool" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not remove driver" });
    }
});

export default router;