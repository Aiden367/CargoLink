// ========== Employee Model ==========
import mongoose, { Schema } from 'mongoose';

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true
  },
  IDNumber: {
    type: String,
    required: true
  }
});

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
