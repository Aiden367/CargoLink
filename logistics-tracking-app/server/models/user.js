import mongoose, { Schema } from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
    type: String,
    required: true
    },
    email: {
    type: String,
    required: true
    },
    password: {
    type: String,
    required: true
    },
    firstName:{
    type: String,
    required: true
    },
    lastName:{
    type: String,
    required: true
    },
    dateAccountCreated:{
        type:Date,
        required:true,
        default: Date.now
    },
    role:{
        type:String,
        required:true,
        default:"Customer"
    }
})

const User = mongoose.model("User", userSchema);

export default User;