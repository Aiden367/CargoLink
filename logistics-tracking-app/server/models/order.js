// ========== Order Model ==========
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        default: () => 'ORDER-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    driverId: {
        type: String,
        default: null
    },
    customerLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], 
            required: true
        }
    },
    deliveryAddress: {
        street: String,
        city: String,
        postalCode: String
    },
    shipmentDetails: {
        items: [String],
        weight: Number,
        notes: String
    },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
        default: 'pending'
    },
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

orderSchema.index({ customerLocation: '2dsphere' });

export default mongoose.model('Order', orderSchema);