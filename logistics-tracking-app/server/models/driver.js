// ========== Driver Model ==========
import mongoose from 'mongoose';

function generateDriverId() {
    return 'DRIVER-' + Math.floor(10000 + Math.random() * 90000); 
}

const driverSchema = new mongoose.Schema({
    DriverId: {
        type: String,
        required: true,
        unique: true,
        default: generateDriverId
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    VehicleId: {
        type: String,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [18.42, -33.92]
        }
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    currentOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    isMoving: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

driverSchema.index({ location: '2dsphere' });

export default mongoose.model('Driver', driverSchema);