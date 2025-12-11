import mongoose from "mongoose";
const { Schema } = mongoose;

// Counter schema for auto-increment vendor ID
function generateVendorId() {
    return 'VENDOR-' + Math.floor(10000 + Math.random() * 90000); 
}
// Vendor schema
const vendorSchema = new Schema({
   vendorId : {
        type: String,
        required: true,
        unique : true,
        default: generateVendorId
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
      type: [Number],   // [longitude, latitude]
      required: true
    }
  }
});


const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);

export default Vendor;
