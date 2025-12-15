import { Router } from "express";
import { authenticateToken } from '../middleware/auth.js';
import { redisClient } from '../server.js';
import { getVehicle } from '../middleware/recieveVehicle.js';
import Vehicle from '../models/vehicle.js';

const DEFAULT_EXPIRATION = 3600;
const router = Router();

router.post('/AddVehicle', authenticateToken, async (req, res) => {
    try {
        console.log('🚗 AddVehicle - req.user:', req.user);
        console.log('📦 AddVehicle - req.body:', req.body);
        
        const { VIN, name, type, year, make, model } = req.body;
        
        if (VIN == null || name == null || type == null || year == null || make == null || model == null) {
            return res.status(400).json({ message: "One of these fields are empty" });
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

        const newVehicle = new Vehicle({
            userId: userId,
            VIN,
            name,
            type,
            year,
            make,
            model
        });

        const addedVehicle = await newVehicle.save();
        console.log('✅ Vehicle saved successfully');
        
        // Clear user-specific cache
        await redisClient.del(`vehicles:user:${userId}`);
        
        res.status(201).json({
            message: "Vehicle successfully saved",
            vehicle: addedVehicle
        });
    } catch (err) {
        console.error('❌ Error saving vehicle:', err);
        res.status(500).json({ 
            message: "Could not save vehicle", 
            error: err.message 
        });
    }
});

router.get('/GetAllVehicles', authenticateToken, async (req, res) => {
    try {
        // Get userId from token (handle different property names)
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token - no user ID found" });
        }

        // Create user-specific cache key
        const cacheKey = `vehicles:user:${userId}`;
        
        const cached = await redisClient.get(cacheKey);
        if (cached != null) {
            console.log("✅ Returning vehicles from redis (Cache Hit) for user:", userId);
            return res.json(JSON.parse(cached));
        }

        console.log("🔍 Fetching vehicles from database for user:", userId);
        
        // Filter vehicles by userId
        const listOfVehicles = await Vehicle.find({ userId: userId })
            .populate('userId', 'username email firstName lastName');
        
        if (listOfVehicles.length === 0) {
            return res.status(404).json({ message: "You have no vehicles" });
        }

        // Cache with user-specific key
        await redisClient.setEx(
            cacheKey,
            DEFAULT_EXPIRATION,
            JSON.stringify(listOfVehicles)
        );

        console.log(`✅ Found ${listOfVehicles.length} vehicles for user ${userId}`);
        res.json(listOfVehicles);
    } catch (err) {
        console.error('❌ Error retrieving vehicles:', err);
        res.status(500).json({ 
            message: "Could not retrieve all vehicles", 
            error: err.message 
        });
    }
});

router.patch('/EditVehicle/:vehicleId', authenticateToken, getVehicle, async (req, res) => {
    try {
        const receivedVehicle = req.vehicle;
        
        // Get userId from token (handle different property names)
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token - no user ID found" });
        }
        
        // Verify the vehicle belongs to the authenticated user
        if (receivedVehicle.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to edit this vehicle" });
        }

        const { VIN, name, type, year, make, model } = req.body;
        
        if (VIN) receivedVehicle.VIN = VIN;
        if (name) receivedVehicle.name = name;
        if (type) receivedVehicle.type = type;
        if (year) receivedVehicle.year = year;
        if (make) receivedVehicle.make = make;
        if (model) receivedVehicle.model = model;

        await receivedVehicle.save();
        
        // Clear user-specific cache
        await redisClient.del(`vehicles:user:${userId}`);

        console.log('✅ Vehicle updated successfully');
        res.json({
            message: "Vehicle updated successfully",
            vehicle: receivedVehicle
        });
    } catch (err) {
        console.error('❌ Error updating vehicle:', err);
        res.status(500).json({ 
            message: "Could not update vehicle", 
            error: err.message 
        });
    }
});

router.get('/SearchForVehicle/:vehicleId', authenticateToken, getVehicle, async (req, res) => {
    try {
        const vehicle = req.vehicle;
        
        // Get userId from token
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        // Verify the vehicle belongs to the authenticated user
        if (vehicle.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to view this vehicle" });
        }
        
        res.json(vehicle);
    } catch (err) {
        console.error('❌ Error searching vehicle:', err);
        res.status(500).json({ 
            message: "Could not find vehicle", 
            error: err.message 
        });
    }
});

router.delete('/DeleteVehicle/:vehicleId', authenticateToken, getVehicle, async (req, res) => {
    try {
        const vehicle = req.vehicle;
        
        // Get userId from token
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token - no user ID found" });
        }
        
        // Verify the vehicle belongs to the authenticated user
        if (vehicle.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this vehicle" });
        }
        
        await Vehicle.findByIdAndDelete(vehicle._id);
        
        // Clear user-specific cache
        await redisClient.del(`vehicles:user:${userId}`);
        
        console.log('✅ Vehicle deleted successfully');
        res.json({ message: "Vehicle deleted successfully" });
    } catch (err) {
        console.error('❌ Error deleting vehicle:', err);
        res.status(500).json({ 
            message: "Could not delete vehicle", 
            error: err.message 
        });
    }
});

export default router;