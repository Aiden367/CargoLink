import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../components/common/Input'
import axios from 'axios';


const CombineUsernames = () =>{
    const firstName = "Aiden"
    const lastName = "Byrne"
    const combinedNames = firstName + lastName;
    console.log(combinedNames);
    return(
        <div>
            <p>This is my full name{combinedNames}</p>
        </div>
    )
}

const Login = () => {

    const [email, setEmail] = useState("");
    const [password,setPassword] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault()
        const userLoginData = {email,password}
        try{
          const response = await axios.post("http://localhost:5000/user/Login",userLoginData)
          console.log("Login Successful", response.data);

        }catch(err){
         console.error("Login Failed", err.message);
        }
    }

    return (
        <div>
            <div>
                <h1>Login</h1>
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