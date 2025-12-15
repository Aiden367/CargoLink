import { Router } from "express";
import { authenticateToken } from '../middleware/auth.js';
import { redisClient } from '../server.js';
import Driver from '../models/Driver.js';

const router = Router();
const DEFAULT_EXPIRATION = 3600;

// Add driver with userId
router.post("/AddDriver", authenticateToken, async (req, res) => {
    try {
        console.log('🚚 AddDriver - req.user:', req.user);
        console.log('📦 AddDriver - req.body:', req.body);
        
        const { name, phoneNumber, VehicleId } = req.body;
        
        if (!name || !phoneNumber) {
            return res.status(400).json({ message: "Name and phone number are required" });
        }

        // Check for different possible property names in the token
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            console.log('❌ Missing user ID in token. req.user:', req.user);
            return res.status(401).json({ 
                message: "Invalid token - no user ID found",
                debug: req.user
            });
        }

        const newDriver = new Driver({
            userId: userId,
            name,
            phoneNumber,
            VehicleId: VehicleId || null,
            location: {
                type: 'Point',
                coordinates: [18.42, -33.92]  // Warehouse location
            }
        });

        const savedDriver = await newDriver.save();
        
        // Add driver to Redis at warehouse location
        await redisClient.geoAdd("drivers", {
            longitude: 18.42,
            latitude: -33.92,
            member: savedDriver.DriverId
        });
        
        // Clear user-specific cache
        await redisClient.del(`drivers:user:${userId}`);
        
        console.log('✅ Driver added successfully');
        res.status(201).json({
            message: "Driver added successfully at warehouse location",
            driver: savedDriver
        });
    } catch (err) {
        console.error('❌ Error adding driver:', err);
        res.status(500).json({ message: "Could not add driver", error: err.message });
    }
});

// Get all drivers for the logged-in user
router.get("/GetAllDrivers", authenticateToken, async (req, res) => {
    try {
        // Get userId from token (handle different property names)
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token - no user ID found" });
        }

        // Create user-specific cache key
        const cacheKey = `drivers:user:${userId}`;
        
        const cached = await redisClient.get(cacheKey);
        if (cached != null) {
            console.log("✅ Returning drivers from redis (Cache Hit) for user:", userId);
            return res.json(JSON.parse(cached));
        }

        console.log("🔍 Fetching drivers from database for user:", userId);
        
        // Filter drivers by userId
        const drivers = await Driver.find({ userId: userId })
            .populate('userId', 'username email firstName lastName');
        
        if (drivers.length === 0) {
            return res.status(404).json({ message: "You have no drivers" });
        }

        // Cache for 1 hour with user-specific key
        await redisClient.setEx(
            cacheKey,
            DEFAULT_EXPIRATION,
            JSON.stringify(drivers)
        );

        console.log(`✅ Found ${drivers.length} drivers for user ${userId}`);
        res.json(drivers);
    } catch (err) {
        console.error('❌ Error retrieving drivers:', err);
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
        
        // Get userId from token
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token - no user ID found" });
        }
        
        // Verify driver exists in database
        const driver = await Driver.findOne({ DriverId: driverId });
        if (!driver) {
            return res.status(404).json({ message: "Driver not found in database" });
        }

        // Verify the driver belongs to the authenticated user
        if (driver.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to update this driver" });
        }

        // Update driver location in MongoDB
        driver.location = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
        await driver.save();

        // Redis GEOADD: longitude comes before latitude!
        await redisClient.geoAdd("drivers", {
            longitude: parseFloat(longitude),
            latitude: parseFloat(latitude),
            member: driverId
        });

        // Clear user-specific cache
        await redisClient.del(`drivers:user:${userId}`);

        console.log('✅ Driver location updated successfully');
        res.json({ 
            message: "Driver location updated",
            driverId,
            driverName: driver.name,
            location: { longitude, latitude }
        });
    } catch (err) {
        console.error('❌ Error updating driver location:', err);
        res.status(500).json({ message: "Could not update driver location", error: err.message });
    }
});

// Get all driver locations within radius of warehouse (for logged-in user only)
router.get("/GetDriverLocations", authenticateToken, async (req, res) => {
    try {
        // Get userId from token
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token - no user ID found" });
        }

        // Get all user's drivers from database to filter by ownership
        const userDrivers = await Driver.find({ userId: userId });
        const userDriverIds = userDrivers.map(d => d.DriverId);

        // Get all drivers within radius from Redis
        const drivers = await redisClient.sendCommand([
            "GEORADIUS",
            "drivers",
            "18.42",      // warehouse longitude
            "-33.92",     // warehouse latitude
            "100",        // radius
            "km",
            "WITHCOORD"
        ]);

        // Filter to only include drivers owned by this user
        const formatted = drivers
            .filter(item => userDriverIds.includes(item[0]))
            .map((item) => {
                const member = item[0];
                const coords = item[1];
                
                return {
                    driverId: member,
                    coordinates: [parseFloat(coords[0]), parseFloat(coords[1])]
                };
            });

        res.json(formatted);
    } catch (err) {
        console.error('❌ Error fetching driver locations:', err);
        res.status(500).json({ message: "Could not fetch driver locations", error: err.message });
    }
});

// Get specific driver location
router.get("/GetDriverLocation/:driverId", authenticateToken, async (req, res) => {
    try {
        const { driverId } = req.params;
        
        // Get userId from token
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token - no user ID found" });
        }
        
        // Verify driver belongs to user
        const driver = await Driver.findOne({ DriverId: driverId });
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }
        
        if (driver.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to view this driver" });
        }
        
        const position = await redisClient.geoPos("drivers", driverId);
        
        if (!position || !position[0]) {
            return res.status(404).json({ message: "Driver location not found or offline" });
        }

        res.json({
            driverId,
            driverName: driver.name,
            coordinates: [
                parseFloat(position[0].longitude),
                parseFloat(position[0].latitude)
            ]
        });
    } catch (err) {
        console.error('❌ Error fetching driver location:', err);
        res.status(500).json({ message: "Could not fetch driver location", error: err.message });
    }
});

// Get driver info by ID
router.get("/GetDriver/:driverId", authenticateToken, async (req, res) => {
    try {
        const { driverId } = req.params;
        
        // Get userId from token
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token - no user ID found" });
        }
        
        const driver = await Driver.findOne({ DriverId: driverId })
            .populate('userId', 'username email firstName lastName');
        
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }
        
        // Verify driver belongs to user
        if (driver.userId._id.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to view this driver" });
        }

        res.json(driver);
    } catch (err) {
        console.error('❌ Error fetching driver:', err);
        res.status(500).json({ message: "Could not fetch driver", error: err.message });
    }
});

// Calculate distance between driver and location
router.post("/CalculateDistance", authenticateToken, async (req, res) => {
    try {
        const { driverId, targetLongitude, targetLatitude } = req.body;
        
        // Get userId from token
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token - no user ID found" });
        }
        
        // Verify driver belongs to user
        const driver = await Driver.findOne({ DriverId: driverId });
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }
        
        if (driver.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized - this is not your driver" });
        }
        
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
            driverName: driver.name,
            distance: distance ? parseFloat(distance) : null,
            unit: "km"
        });
    } catch (err) {
        console.error('❌ Error calculating distance:', err);
        res.status(500).json({ message: "Could not calculate distance", error: err.message });
    }
});

// Remove driver (when they go offline)
router.delete("/RemoveDriver/:driverId", authenticateToken, async (req, res) => {
    try {
        const { driverId } = req.params;
        
        // Get userId from token
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token - no user ID found" });
        }
        
        // Verify driver exists and belongs to user
        const driver = await Driver.findOne({ DriverId: driverId });
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        if (driver.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to remove this driver" });
        }

        // Remove from Redis geospatial index
        await redisClient.zRem("drivers", driverId);
        
        // Clear user-specific cache
        await redisClient.del(`drivers:user:${userId}`);

        console.log('✅ Driver removed successfully');
        res.json({ message: "Driver removed from active pool" });
    } catch (err) {
        console.error('❌ Error removing driver:', err);
        res.status(500).json({ message: "Could not remove driver", error: err.message });
    }
});

// Delete driver permanently from database
router.delete("/DeleteDriver/:driverId", authenticateToken, async (req, res) => {
    try {
        const { driverId } = req.params;
        
        // Get userId from token
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token - no user ID found" });
        }
        
        // Verify driver exists and belongs to user
        const driver = await Driver.findOne({ DriverId: driverId });
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        if (driver.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this driver" });
        }

        // Remove from Redis geospatial index
        await redisClient.zRem("drivers", driverId);
        
        // Delete from database
        await Driver.findByIdAndDelete(driver._id);
        
        // Clear user-specific cache
        await redisClient.del(`drivers:user:${userId}`);

        console.log('✅ Driver deleted permanently');
        res.json({ message: "Driver deleted successfully" });
    } catch (err) {
        console.error('❌ Error deleting driver:', err);
        res.status(500).json({ message: "Could not delete driver", error: err.message });
    }
});

export default router;