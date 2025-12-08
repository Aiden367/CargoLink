import { Router } from "express";
import Customer from '../models/customer.js'
import { authenticateToken } from '../middleware/auth.js'
import { getCustomer } from '../middleware/recieveCustomer.js'
import { redisClient } from '../server.js';
import Product from '../models/product.js'
const router = Router();

router.post("/AddProduct", async (req,res) => {
    try {
        const { productName, productAmount, productCost } = req.body
        if (productName == null || productAmount == null || productCost == null) {
            return res.status(400).json({ message: "one of these fields are empty" })
        }
        const product = new Product({
            productName,
            productAmount,
            productCost
        })
        const newProduct = await product.save()
        res.status(201).json({ messsage: "Product successfully saved", newProduct })
    } catch (err) {
        res.status(500).json({ message: "Error saving product", error: err.message })
    }

}) 

router.get('/GetProducts',async (req,res) =>{
   try{
      const allProducts = await Product.find()
      if(allProducts == null){
        return res.status(401).json({message: "products list are empty"})
      }
      res.status(201).json({messsage: "products recieved sucessfully"})
    }catch(err){
    res.status(400).json({message: "could not recieve all products", error: err.message })
   }
})

export default router;