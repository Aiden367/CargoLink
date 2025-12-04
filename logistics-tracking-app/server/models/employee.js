import mongoose, { Schema } from 'mongoose';

const employeeSchema = new mongoose.Schema({
 firstName:{
    type:String,
    required:true,
 },
 lastName:{
    type:String,
    required:true
 },
 IDNumber:{
    type:String,
    required:true
 }
})


const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;