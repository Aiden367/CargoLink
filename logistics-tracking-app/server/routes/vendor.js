import { Router } from "express";
import Customer from '../models/customer.js'
import { authenticateToken } from '../middleware/auth.js'
import { getCustomer } from '../middleware/recieveCustomer.js'
import { createClient } from 'redis';
import { redisClient } from '../server.js';
import Vendor from '../models/vendor.js'
import { getVendor } from '../middleware/receiveVendor.js'


const router = Router()
const DEFAULT_EXPERIRATION = 3600
router.post('/AddVendor', authenticateToken, async (req, res) => {
    try {
        const { shopName, longitude, latitude } = req.body
        if (shopName == null || longitude == null || latitude == null) {
            return res.status(400).json({ message: "Fields are empty" })
        }

        res.json(req.user)
        const vendor = new Vendor({
            userId: req.user.id, // Add userId from authenticated user
            shopName,
            location: {
                type: "Point",
                coordinates: [longitude, latitude]
            }
        })
        const newVendor = await vendor.save()
        
        // Add vendor to Redis geospatial index
        await redisClient.geoAdd("vendors", {
            longitude: parseFloat(longitude),
            latitude: parseFloat(latitude),
            member: newVendor._id.toString()
        });
        
        await redisClient.del("vendors");
        res.status(201).json({ message: "Vendor saved successfully", newVendor })
    } catch (err) {
        res.status(500).json({ message: "error saving vendor", error: err.message })
    }
})

router.get('/GetVendors', authenticateToken, async (req, res) => {
    try {
        const cached = await redisClient.get('vendors')
        if (cached != null) {
            return res.json(JSON.parse(cached));
        }
        const listOfVendors = await Vendor.find().populate('userId', 'username email firstName lastName')
        if (listOfVendors.length === 0) {
            return res.status(404).json({ message: "List of vendors are empty" })
        }
        await redisClient.setEx(
            'vendors',
            DEFAULT_EXPERIRATION,
            JSON.stringify(listOfVendors)
        )
        res.status(200).json({ message: "Successfully received list of vendors", listOfVendors })
    } catch (err) {
        res.status(500).json({ message: "error trying to retrieve vendors", error: err.message })
    }
})

router.get('/FindVendor/:vendorId', authenticateToken, getVendor, async (req, res) => {
    try {
        if (req.vendor == null) {
            return res.status(404).json({ message: "vendor could not be found" })
        }
        res.json(req.vendor)
    } catch (err) {
        res.status(500).json({ message: "Could not grab vendor", error: err.message })
    }
})

router.patch('/EditVendor/:vendorId', authenticateToken, getVendor, async (req, res) => {
    try {
        const vendor = req.vendor;
        
        // Verify the vendor belongs to the authenticated user
        if (vendor.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized to edit this vendor" });
        }

        const { shopName, longitude, latitude } = req.body;
        
        if (shopName) vendor.shopName = shopName;
        
        if (longitude && latitude) {
            vendor.location = {
                type: "Point",
                coordinates: [longitude, latitude]
            };
            
            // Update Redis geospatial data
            await redisClient.geoAdd("vendors", {
                longitude: parseFloat(longitude),
                latitude: parseFloat(latitude),
                member: vendor._id.toString()
            });
        }
        
        await vendor.save();
        await redisClient.del("vendors"); // Invalidate cache
        
        res.status(200).json({
            message: "Vendor updated successfully",
            vendor
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})


router.delete('/DeleteVendor/:vendorId', authenticateToken, getVendor, async (req, res) => {
    try {
        const vendor = req.vendor;
        
        // Verify the vendor belongs to the authenticated user
        if (vendor.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized to delete this vendor" });
        }

        await vendor.deleteOne();
        await redisClient.del("vendors"); // Invalidate cache
        
        res.json({ message: "Vendor deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

export default router;