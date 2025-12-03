import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../components/common/Input'
import axios from 'axios';
import { useNavigate } from "react-router-dom";



const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password,setPassword] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault()
        const userLoginData = {email,password}
        try{
          const response = await axios.post("http://localhost:5000/user/Login",userLoginData)
          console.log("Login Successful", response.data);
          navigate("/home");

        }catch(err){
         console.error("Login Failed", err.message);
        }
    }

    return (
        <div>
            <div>
                <h1>Log</h1>
                <p>Email</p>
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email"
                        error={email && !email.includes("@") ? "Invalid email" : ""}
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Password"
                    />
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>
    )
}
export default Login;