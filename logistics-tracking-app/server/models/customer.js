// ========== Customer Model ==========
import mongoose from 'mongoose';
const { Schema } = mongoose;

const counterSchema = new Schema({
  _id: String,       
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const customerSchema = new Schema({
  customerID: {
    type: String,
    unique: true 
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

customerSchema.pre("save", async function (next) {
  if (!this.customerID) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "customerID" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true } 
    );
    const seqNumber = counter.seq.toString().padStart(4, "0");
    this.customerID = `CUST-${seqNumber}`; 
  }
  next();
});

const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
export default Customer;