import mongoose from 'mongoose';

const { Schema } = mongoose;

// Counter schema for sequential orderIDs
const counterSchema = new Schema({
  _id: String, // e.g., "orderID"
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Order schema
const orderSchema = new Schema({
  orderID: {
    type: String,
    unique: true
  },
  driverId:{
    type:String,
    required:true
  },
  customerId: {
    type: String,
    required: true
  },
  shipmentDetails: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

// Pre-save hook to auto-generate sequential orderID
orderSchema.pre('save', async function (next) {
  if (!this.orderID) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'orderID' },       // counter document for orderID
      { $inc: { seq: 1 } },     // increment sequence
      { new: true, upsert: true } // create if doesn't exist
    );

    const seqNumber = counter.seq.toString().padStart(4, '0'); // e.g., 0001
    this.orderID = `ORD-${seqNumber}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);
