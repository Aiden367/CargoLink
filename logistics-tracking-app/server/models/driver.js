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
    VehicleId: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
});

export default mongoose.model('Driver', driverSchema);
