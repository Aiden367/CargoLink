// ========== Product Model ==========
import mongoose from 'mongoose';

function generateProductId() {
    return 'PRODUCT-' + Math.floor(10000 + Math.random() * 90000); 
}

const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        unique: true,
        default: generateProductId
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productAmount: {
        type: String,
        required: true,
    },
    productCost: {
        type: String,
        required: true
    },
    dateInventoryCreated: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const Product = mongoose.model("Product", productSchema);
export default Product;