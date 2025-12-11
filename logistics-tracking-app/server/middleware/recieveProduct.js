import Product from "../models/product.js";


export const getProduct = async (req, res, next) => {
    try {
        const foundProduct = await Product.findOne({ productId: req.params.productId })
        if (foundProduct == null) {
            return res.status(400).json({ message: "Could not find product" })
        }
        req.product = foundProduct
        next();
    } catch (err) {
        res.status(500).json({ message: "Could not retrieve product" })
    }
}

export default getProduct;
