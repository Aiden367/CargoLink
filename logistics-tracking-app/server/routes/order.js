// routes/order.js
import { Router } from "express";
import Order from '../models/order.js';
import Customer from '../models/customer.js';
import Driver from '../models/Driver.js';
import { authenticateToken } from '../middleware/auth.js';
import { getOrder } from '../middleware/recieveOrder.js';
import { redisClient } from '../server.js';
import { startDriverMovement, stopDriverMovement } from '../services/driverMovement.js';

const router = Router();
const WAREHOUSE = { longitude: 18.42, latitude: -33.92 };

// Create order and automatically assign nearest driver
router.post('/CreateOrder', authenticateToken, async (req, res) => {
    try {
        const { customerId, shipmentDetails, deliveryAddress } = req.body;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const customerLongitude = customer.location.coordinates[0];
        const customerLatitude = customer.location.coordinates[1];

        const orderData = new Order({
            userId: req.user.id, // Add userId from authenticated user
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

        const assignedDriver = await assignNearestDriver(
            newOrder._id,
            customerLongitude,
            customerLatitude
        );

        if (assignedDriver) {
            newOrder.driverId = assignedDriver.driverId;
            newOrder.status = 'assigned';
            await newOrder.save();

            // Update driver in database
            await Driver.findOneAndUpdate(
                { DriverId: assignedDriver.driverId },
                { 
                    currentOrderId: newOrder._id,
                    isAvailable: false 
                }
            );

            // Start driver movement towards customer
            startDriverMovement(
                assignedDriver.driverId,
                customerLatitude,
                customerLongitude
            );

            res.status(201).json({
                message: "Order created and driver assigned. Driver is on the way!",
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
        const nearbyDrivers = await redisClient.sendCommand([
            "GEORADIUS",
            "drivers",
            customerLng.toString(),
            customerLat.toString(),
            "50", // 50km radius
            "km",
            "WITHCOORD",
            "WITHDIST",
            "ASC"
        ]);

        if (!nearbyDrivers || nearbyDrivers.length === 0) {
            console.log("No drivers available within radius");
            return null;
        }

        for (const driver of nearbyDrivers) {
            const driverId = driver[0];
            const distance = parseFloat(driver[1]);
            const coords = driver[2];

            const isAssigned = await redisClient.get(`driver:${driverId}:assigned`);
            
            if (!isAssigned) {
                await redisClient.setEx(
                    `driver:${driverId}:assigned`,
                    7200, // 2 hours
                    orderId.toString()
                );

                await redisClient.setEx(
                    `order:${orderId}:driver`,
                    7200,
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

        // Verify the order belongs to the authenticated user
        if (order.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized to assign driver to this order" });
        }

        const driverLocation = await redisClient.geoPos("drivers", driverId);
        if (!driverLocation || !driverLocation[0]) {
            return res.status(404).json({ message: "Driver not found or offline" });
        }

        const existingAssignment = await redisClient.get(`driver:${driverId}:assigned`);
        if (existingAssignment && existingAssignment !== orderId.toString()) {
            return res.status(400).json({ message: "Driver already assigned to another order" });
        }

        order.driverId = driverId;
        order.status = 'assigned';
        await order.save();

        await redisClient.setEx(`driver:${driverId}:assigned`, 7200, orderId.toString());
        await redisClient.setEx(`order:${orderId}:driver`, 7200, driverId);

        // Update driver
        await Driver.findOneAndUpdate(
            { DriverId: driverId },
            { 
                currentOrderId: order._id,
                isAvailable: false 
            }
        );

        // Start driver movement
        const customerLat = order.customerLocation.coordinates[1];
        const customerLng = order.customerLocation.coordinates[0];
        
        startDriverMovement(driverId, customerLat, customerLng);

        res.json({
            message: "Driver assigned successfully. Driver is on the way!",
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

// Update delivery status
router.patch('/UpdateDeliveryStatus', authenticateToken, getOrder, async (req, res) => {
    const order = req.order;
    try {
        if (!order) {
            return res.status(404).json({ message: "Order does not exist" });
        }

        // Verify the order belongs to the authenticated user
        if (order.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized to update this order" });
        }

        const { status } = req.body;
        const validStatuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        order.status = status;

        if (status === 'delivered' || status === 'cancelled') {
            if (order.driverId) {
                // Stop driver movement
                stopDriverMovement(order.driverId);
                
                // Free up the driver
                await redisClient.del(`driver:${order.driverId}:assigned`);
                await redisClient.del(`order:${order._id}:driver`);
                
                // Update driver availability
                await Driver.findOneAndUpdate(
                    { DriverId: order.driverId },
                    { 
                        isAvailable: true,
                        currentOrderId: null,
                        isMoving: false
                    }
                );
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

// Get order with driver location in real-time
router.get('/GetOrderTracking/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId).populate('customerId');
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify the order belongs to the authenticated user
        if (order.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized to view this order" });
        }

        let driverLocation = null;
        let estimatedArrival = null;
        let distanceToCustomer = null;

        if (order.driverId) {
            const location = await redisClient.geoPos("drivers", order.driverId);
            
            if (location && location[0]) {
                driverLocation = {
                    longitude: parseFloat(location[0].longitude),
                    latitude: parseFloat(location[0].latitude)
                };

                // Add customer as temporary point to calculate distance
                await redisClient.geoAdd("drivers", {
                    longitude: order.customerLocation.coordinates[0],
                    latitude: order.customerLocation.coordinates[1],
                    member: `temp_customer_${orderId}`
                });

                const distance = await redisClient.geoDist(
                    "drivers",
                    order.driverId,
                    `temp_customer_${orderId}`,
                    "km"
                );

                // Remove temporary point
                await redisClient.zRem("drivers", `temp_customer_${orderId}`);

                if (distance) {
                    distanceToCustomer = parseFloat(distance).toFixed(2);
                    const hours = parseFloat(distance) / 40;
                    estimatedArrival = new Date(Date.now() + hours * 60 * 60 * 1000);
                }
            }
        }

        res.json({
            order,
            driverLocation,
            estimatedArrival,
            distanceToCustomer,
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

// Get all orders with driver info (for authenticated user only)
router.get('/GetAllOrders', authenticateToken, async (req, res) => {
    try {
        // Only get orders for the authenticated user
        const orders = await Order.find({ userId: req.user.id })
            .populate('customerId')
            .sort({ createdAt: -1 });
        
        if (orders.length === 0) {
            return res.status(404).json({ message: "No orders found" });
        }

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

// Get active deliveries (for authenticated user only)
router.get('/GetActiveDeliveries', authenticateToken, async (req, res) => {
    try {
        const activeOrders = await Order.find({
            userId: req.user.id, // Filter by authenticated user
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

// Delete order (new endpoint)
router.delete('/DeleteOrder/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify the order belongs to the authenticated user
        if (order.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized to delete this order" });
        }

        // If order has assigned driver, free them up
        if (order.driverId) {
            stopDriverMovement(order.driverId);
            await redisClient.del(`driver:${order.driverId}:assigned`);
            await redisClient.del(`order:${order._id}:driver`);
            
            await Driver.findOneAndUpdate(
                { DriverId: order.driverId },
                { 
                    isAvailable: true,
                    currentOrderId: null,
                    isMoving: false
                }
            );
        }

        await order.deleteOne();
        res.json({ message: "Order deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not delete order", error: err.message });
    }
});

export default router;