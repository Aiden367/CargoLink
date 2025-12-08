
import mongoose, { Schema } from 'mongoose';


function generateVehicleId() {
    return 'VEHICLE' + Math.floor(10000 + Math.random() * 90000); 
}

const vehicleSchema = new mongoose.Schema({
    vehicleId : {
        type: String,
        required: true,
        unique : true,
        default: generateVehicleId
    },
    VIN: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    make: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Vehicle = mongoose.model("Vehicle", vehicleSchema)

export default Vehicle