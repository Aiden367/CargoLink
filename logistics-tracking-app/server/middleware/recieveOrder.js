import Order from "../models/order.js"

export const getOrder = async (req, res, next) => {
    try {
        // Look for the order using orderID from the request body
        const order = await Order.findOne({ orderID: req.body.orderID });
        if (!order) {
            return res.status(404).json({ message: "Order could not be found" });
        }
        req.order = order; // attach order to req
        next(); // go to the next middleware or route handler
    } catch (err) {
        res.status(500).json({ message: "Error fetching order", error: err.message });
    }
};

export default getOrder;