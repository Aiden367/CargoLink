// routes/order.js
import { Router } from "express";
import Order from '../models/order.js';
import Customer from '../models/customer.js';
import { authenticateToken } from '../middleware/auth.js';
import { getOrder } from '../middleware/recieveOrder.js';
import { redisClient } from '../server.js';

const router = Router();
const WAREHOUSE = { longitude: 18.42, latitude: -33.92 };

// Create order and automatically assign nearest driver
router.post('/CreateOrder', authenticateToken, async (req, res) => {
    try {
        const { customerId, shipmentDetails, deliveryAddress } = req.body;

        // Get customer location
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Extract customer coordinates
        const customerLongitude = customer.location.coordinates[0];
        const customerLatitude = customer.location.coordinates[1];

        // Create order with customer location
        const orderData = new Order({
            customerId,
            customerLocation: {
                type: "Point",
                coordinates: [customerLongitude, customerLatitude]
            },
            deliveryAddress,
            shipmentDetails,
            status: 'pending'
        });

        const newOrder = await orderData.save();

        // Try to assign nearest available driver
        const assignedDriver = await assignNearestDriver(
            newOrder._id,
            customerLongitude,
            customerLatitude
        );

        if (assignedDriver) {
            newOrder.driverId = assignedDriver.driverId;
            newOrder.status = 'assigned';
            await newOrder.save();

            res.status(201).json({
                message: "Order created and driver assigned",
                order: newOrder,
                driver: assignedDriver
            });
        } else {
            res.status(201).json({
                message: "Order created, waiting for available driver",
                order: newOrder,
                driver: null
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not create order", error: err.message });
    }
});

// Find and assign nearest available driver
async function assignNearestDriver(orderId, customerLng, customerLat) {
    try {
        // Find drivers within 20km radius of customer
        const nearbyDrivers = await redisClient.sendCommand([
            "GEORADIUS",
            "drivers",
            customerLng.toString(),
            customerLat.toString(),
            "20", // 20km radius
            "km",
            "WITHCOORD",
            "WITHDIST",
            "ASC" // Closest first
        ]);

        if (!nearbyDrivers || nearbyDrivers.length === 0) {
            console.log("No drivers available within radius");
            return null;
        }

        // Get first available driver (not already assigned)
        for (const driver of nearbyDrivers) {
            const driverId = driver[0];
            const distance = parseFloat(driver[1]);
            const coords = driver[2];

            // Check if driver is already assigned to an order
            const isAssigned = await redisClient.get(`driver:${driverId}:assigned`);
            
            if (!isAssigned) {
                // Mark driver as assigned
                await redisClient.setEx(
                    `driver:${driverId}:assigned`,
                    3600, // 1 hour expiration
                    orderId.toString()
                );

                // Store order-driver relationship
                await redisClient.setEx(
                    `order:${orderId}:driver`,
                    3600,
                    driverId
                );

                return {
                    driverId,
                    distance: distance.toFixed(2),
                    location: {
                        longitude: parseFloat(coords[0]),
                        latitude: parseFloat(coords[1])
                    }
                };
            }
        }

        return null;
    } catch (err) {
        console.error("Error assigning driver:", err);
        return null;
    }
}

// Manually assign specific driver to order
router.post('/AssignDriver', authenticateToken, async (req, res) => {
    try {
        const { orderId, driverId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check if driver exists in Redis
        const driverLocation = await redisClient.geoPos("drivers", driverId);
        if (!driverLocation || !driverLocation[0]) {
            return res.status(404).json({ message: "Driver not found or offline" });
        }

        // Check if driver is already assigned
        const existingAssignment = await redisClient.get(`driver:${driverId}:assigned`);
        if (existingAssignment && existingAssignment !== orderId.toString()) {
            return res.status(400).json({ message: "Driver already assigned to another order" });
        }

        // Assign driver
        order.driverId = driverId;
        order.status = 'assigned';
        await order.save();

        // Mark driver as assigned
        await redisClient.setEx(`driver:${driverId}:assigned`, 3600, orderId.toString());
        await redisClient.setEx(`order:${orderId}:driver`, 3600, driverId);

        res.json({
            message: "Driver assigned successfully",
            order,
            driverLocation: {
                longitude: parseFloat(driverLocation[0].longitude),
                latitude: parseFloat(driverLocation[0].latitude)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not assign driver", error: err.message });
    }
});

// Get order with driver location in real-time
router.get('/GetOrderTracking/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId).populate('customerId');
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        let driverLocation = null;
        let estimatedArrival = null;

        if (order.driverId) {
            // Get current driver location from Redis
            const location = await redisClient.geoPos("drivers", order.driverId);
            
            if (location && location[0]) {
                driverLocation = {
                    longitude: parseFloat(location[0].longitude),
                    latitude: parseFloat(location[0].latitude)
                };

                // Calculate distance to customer
                const distance = await redisClient.geoDist(
                    "drivers",
                    order.driverId,
                    `temp_customer_${orderId}`,
                    "km"
                );

                if (distance) {
                    // Estimate arrival (assuming 40 km/h average speed)
                    const hours = parseFloat(distance) / 40;
                    estimatedArrival = new Date(Date.now() + hours * 60 * 60 * 1000);
                }
            }
        }

        res.json({
            order,
            driverLocation,
            estimatedArrival,
            customerLocation: {
                longitude: order.customerLocation.coordinates[0],
                latitude: order.customerLocation.coordinates[1]
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not get tracking info", error: err.message });
    }
});

// Update delivery status
router.patch('/UpdateDeliveryStatus', authenticateToken, getOrder, async (req, res) => {
    const order = req.order;
    try {
        if (!order) {
            return res.status(404).json({ message: "Order does not exist" });
        }

        const { status } = req.body;
        const validStatuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        order.status = status;

        // If delivered or cancelled, free up the driver
        if (status === 'delivered' || status === 'cancelled') {
            if (order.driverId) {
                await redisClient.del(`driver:${order.driverId}:assigned`);
                await redisClient.del(`order:${order._id}:driver`);
            }
            
            if (status === 'delivered') {
                order.actualDeliveryTime = new Date();
            }
        }

        const updatedOrder = await order.save();
        res.json({ 
            message: "Order status updated", 
            order: updatedOrder 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Get all orders with driver info
router.get('/GetAllOrders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find().populate('customerId').sort({ createdAt: -1 });
        
        if (orders.length === 0) {
            return res.status(404).json({ message: "No orders found" });
        }

        // Enrich orders with real-time driver locations
        const enrichedOrders = await Promise.all(orders.map(async (order) => {
            let driverLocation = null;
            
            if (order.driverId) {
                const location = await redisClient.geoPos("drivers", order.driverId);
                if (location && location[0]) {
                    driverLocation = {
                        longitude: parseFloat(location[0].longitude),
                        latitude: parseFloat(location[0].latitude)
                    };
                }
            }

            return {
                ...order.toObject(),
                driverLocation
            };
        }));

        res.json(enrichedOrders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            message: "Could not retrieve orders", 
            error: err.message 
        });
    }
});

// Get active deliveries (for dashboard)
router.get('/GetActiveDeliveries', authenticateToken, async (req, res) => {
    try {
        const activeOrders = await Order.find({
            status: { $in: ['assigned', 'picked_up', 'in_transit'] }
        }).populate('customerId');

        const deliveries = await Promise.all(activeOrders.map(async (order) => {
            let driverLocation = null;

            if (order.driverId) {
                const location = await redisClient.geoPos("drivers", order.driverId);
                if (location && location[0]) {
                    driverLocation = {
                        longitude: parseFloat(location[0].longitude),
                        latitude: parseFloat(location[0].latitude)
                    };
                }
            }

            return {
                orderId: order._id,
                orderNumber: order.orderId,
                customerName: order.customerId.shopName,
                customerLocation: {
                    longitude: order.customerLocation.coordinates[0],
                    latitude: order.customerLocation.coordinates[1]
                },
                driverId: order.driverId,
                driverLocation,
                status: order.status,
                createdAt: order.createdAt
            };
        }));

        res.json(deliveries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not get active deliveries", error: err.message });
    }
});

export default router;