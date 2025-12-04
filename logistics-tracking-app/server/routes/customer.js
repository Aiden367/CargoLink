import { Router } from "express";
import Customer from '../models/customer.js'
import { authenticateToken } from '../middleware/auth.js'
import { getCustomer } from '../middleware/recieveCustomer.js'
const router = Router();

router.post('/AddCustomer',authenticateToken,async(req,res)=>{
   try{
     const {shopName,longitude,latitude} = req.body;
     const customer = new Customer({
        shopName,
        location:{
            type:"Point",
            coordinates:[longitude,latitude]
        }
     })
     if(shopName == null || longitude == null || latitude == null){
        res.status(401).json({message : "Fields are missing"})
     }

     const newCustomer = await customer.save();
     res.status(201).json(newCustomer)
   }catch(err){
    res.status(500).json({message:message.err})
   }

})

router.get('/GetAllCustomers',async(req,res) =>{
    try{
       const customer = await Customer.find()
       if(customer == null){
        res.status(401).json({message:"List of customers are empty"})
       }
       res.json(customer);
    }catch(err){
        res.status(401).json({messsage:message.err})
    }
})

router.patch('/EditCustomer', authenticateToken, getCustomer, async (req, res) => {
    try {
        const customer = req.customer;
        const { longitude, latitude } = req.body;
        if (longitude && latitude) {
            customer.location = {
                type: "Point",
                coordinates: [longitude, latitude]  
            };
        }
        await customer.save();
        res.status(200).json({
            message: "Customer updated successfully",
            customer
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;