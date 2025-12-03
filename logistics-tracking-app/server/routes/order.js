import { Router } from "express";
import Order from '../models/order.js'
import { authenticateToken } from '../middleware/auth.js'
import { getOrder } from '../middleware/recieveOrder.js'
const router = Router();

router.post('/CreateOrder', authenticateToken, async (req, res) => {
    const orderData = new Order({
        customerId: req.user.id,
        shipmentDetails: req.body.shipmentDetails,
        status: req.body.status,
        assignedDriver: req.body.assignedDriver
    })
    try {
        const newOrder = await orderData.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})

router.patch('/EditDeliveryStatus', authenticateToken,getOrder, async (req, res) => {
  const order = req.order
  try{
   if(order == null){
    return res.status(401).json({message:"Order does not exist"})
   }
   order.status = req.body.status
   const updateOrder = await order.save();
   res.json({message:"Order status has been updated",order: updateOrder})
  }catch(err){
    res.status(401).json({message:message.err})
  }
})

router.get('/GetAllOrders',authenticateToken,async(req,res)  =>{
 const orders = await Order.find();
 if(orders == null){
    res.status(400).json({messsage:"No orders found"})
 }
 res.json(orders);
})


export default router; 