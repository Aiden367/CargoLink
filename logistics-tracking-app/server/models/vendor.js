import mongoose from "mongoose";
const { Schema } = mongoose;

function generateVendorId() {
    return 'VENDOR-' + Math.floor(10000 + Math.random() * 90000); 
}

const vendorSchema = new Schema({
    vendorId: {
        type: String,
        required: true,
        unique: true,
        default: generateVendorId
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shopName: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
});

const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
export default Vendor;