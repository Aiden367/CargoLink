import mongoose from "mongoose";
const { Schema } = mongoose;

// Counter schema for auto-increment vendor ID
const counterSchema = new Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// Vendor schema
const vendorSchema = new Schema({
  vendorID: {
    type: String,
    unique: true
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


vendorSchema.pre("save", async function (next) {
  if (!this.vendorID) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "vendorID" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const seqNumber = counter.seq.toString().padStart(4, "0");
    this.vendorID = `VEN-${seqNumber}`;
  }
  next();
});

// Export Vendor model
const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);

export default Vendor;
