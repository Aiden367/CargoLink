import { Router } from "express";
import { authenticateToken } from '../middleware/auth.js';
import { redisClient } from '../server.js';
import { getProduct } from '../middleware/recieveProduct.js';
import Product from '../models/product.js';

const router = Router();
const DEFAULT_EXPIRATION = 3600;

router.post("/AddProduct", authenticateToken, async (req, res) => {
    try {
        const { productName, productAmount, productCost } = req.body;
        
        if (productName == null || productAmount == null || productCost == null) {
            return res.status(400).json({ message: "One of these fields are empty" });
        }

        if (!req.user?.id) {
            return res.status(401).json({ message: "Invalid token" });
        }

        const product = new Product({
            userId: req.user.id,
            productName,
            productAmount,
            productCost
        });

        const newProduct = await product.save();
        await redisClient.del("products");
        
        res.status(201).json({ 
            message: "Product successfully saved", 
            product: newProduct 
        });
    } catch (err) {
        res.status(500).json({ 
            message: "Error saving product", 
            error: err.message 
        });
    }
});

router.get('/GetProducts', authenticateToken, async (req, res) => {
    try {
        const cached = await redisClient.get('products');
        if (cached != null) {
            console.log("Returning products from redis (Cache Hit)");
            return res.json(JSON.parse(cached));
        }

        const listOfProducts = await Product.find().populate('userId', 'username email firstName lastName');
        
        if (listOfProducts.length === 0) {
            return res.status(404).json({ message: "Products list are empty" });
        }

        await redisClient.setEx(
            'products',
            DEFAULT_EXPIRATION,
            JSON.stringify(listOfProducts)
        );

        res.json({
            message: "Products received successfully",
            products: listOfProducts
        });
    } catch (err) {
        res.status(500).json({ 
            message: "Could not receive all products", 
            error: err.message 
        });
    }
});

router.get('/FindProduct/:productId', authenticateToken, getProduct, async (req, res) => {
    res.json(req.product);
});

router.patch('/EditProduct/:productId', authenticateToken, getProduct, async (req, res) => {
    try {
        const product = req.product;
        
        // Verify the product belongs to the authenticated user
        if (product.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized to edit this product" });
        }

        const { productName, productAmount, productCost } = req.body;
        
        if (productName) product.productName = productName;
        if (productAmount != null) product.productAmount = productAmount;
        if (productCost != null) product.productCost = productCost;

        await product.save();
        await redisClient.del("products"); // Invalidate cache

        res.json({
            message: "Product updated successfully",
            product
        });
    } catch (err) {
        res.status(500).json({ 
            message: "Could not update product", 
            error: err.message 
        });
    }
});

export default router;