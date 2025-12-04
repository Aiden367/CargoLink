
import mongoose, { Schema } from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        unique: true
    },
    VIN: {
        type: String,
        unique: true
    },
    Name: {
        type: String,
        required: true
    },
    Type: {
        type: String,
        required: true
    },
    Year: {
        type: String,
        required: true
    },
    Make: {
        type: String,
        required: true
    },
    Model: {
        type: String,
        required: true
    }
})

const Vehicle = mongoose.Model("Vehicle", vehicleSchema)

export default Vehicle