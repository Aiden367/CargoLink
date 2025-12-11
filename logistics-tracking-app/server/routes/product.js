import { Router } from "express";
import Customer from '../models/customer.js'
import { authenticateToken } from '../middleware/auth.js'
import { getCustomer } from '../middleware/recieveCustomer.js'
import { redisClient } from '../server.js';
import { getProduct } from '../middleware/recieveProduct.js'
import Product from '../models/product.js'
const router = Router();
const DEFAULT_EXPERIRATION = 3600
router.post("/AddProduct", async (req, res) => {
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
        await redisClient.del("products");
        res.status(201).json({ messsage: "Product successfully saved", newProduct })
    } catch (err) {
        res.status(500).json({ message: "Error saving product", error: err.message })
    }

})

router.get('/GetProducts', async (req, res) => {
    try {
        const cached = await redisClient.get('vehicles')
        if(cached != null){
            return res.json(JSON.parse(cached));
        }
        const listOfProducts = await Product.find()
        if (listOfProducts.length == null) {
            return res.status(401).json({ message: "products list are empty" })
        }
        await redisClient.setEx(
                    'products',
                    DEFAULT_EXPERIRATION,
                    JSON.stringify(listOfProducts)
                )
        res.status(201).json({ messsage: "products recieved sucessfully",listOfProducts })
    } catch (err) {
        res.status(400).json({ message: "could not recieve all products", error: err.message })
    }
})

router.get('/FindProduct/:productId',getProduct,async(req,res) =>{
    res.json(req.product);
})
export default router;