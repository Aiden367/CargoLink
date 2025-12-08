import { Router } from "express";
import Customer from '../models/customer.js'
import { authenticateToken } from '../middleware/auth.js'
import { getCustomer } from '../middleware/recieveCustomer.js'
import { createClient } from 'redis';
import { redisClient } from '../server.js';
import Vendor from '../models/vendor.js'


const router = new Router()
const DEFAULT_EXPERIRATION = 3600
router.post('/AddVendor', async (req, res) => {

    try {
        const { shopName, longitude, latitude } = req.body
        if (shopName == null || longitude == null || latitude == null) {
            return res.status(401).json({ messagee: "Fields are empty" })
        }
        const vendor = new Vendor({
            shopName,
            location: {
                type: "Point",
                coordinates: [longitude, latitude]
            }
        })
        const newVendor = await vendor.save()
        await redisClient.del("vendors");
        res.status(201).json({ messsage: "Vendor saved successfully", newVendor })
    } catch (err) {
        res.status(500).json({ message: "error saving vendor", error: err.message })
    }
})

router.get('/GetVendors', async (req, res) => {
    try {
        const cached = await redisClient.get('vendors')
        if (cached != null) {
            return res.json(JSON.parse(cached));
        }
        const listOfVendors = await Vendor.find()
        if (listOfVendors.length == 0) {
            return res.status(400).json({ message: "List of vendors are empty" })
        }
        await redisClient.setEx(
                            'vendors',
                            DEFAULT_EXPERIRATION,
                            JSON.stringify(listOfVendors)
                        )
        res.status(201).json({ message: "Successsfulyy recieved list  of vendors", listOfVendors })
    } catch (err) {
        res.status(500).json({ message: "error trying to retrieve vendors", error: err.message })
    }
})
export default router;