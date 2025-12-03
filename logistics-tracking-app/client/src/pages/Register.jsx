import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../components/common/Input'
import axios from 'axios';
import { useNavigate } from "react-router-dom";
const Register = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const usernameRegex = /^(?=.*[A-Z])(?=.*\d).+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{10,}$/;
    const handleSubmit = async (e) => {
        e.preventDefault();
        const userData = { username, email, password, firstName, lastName }
        try {
            const response = await axios.get("http://localhost:5000/user/GetAllUsers")
            const user = response.data;
            const UsernameExists = user.some(u => u.username === userData.username)
            if(UsernameExists){
                return console.log("Username already exists")
            }
        } catch (err) {
            console.error(err);
        }
        try {
            const response = await axios.post("http://localhost:5000/user/Register", userData)
            console.log("User Created", response.data)
            navigate("/login")
        } catch (err) {
            console.log("Cannot save user");
            console.error(err)
        }
    }
    return (
        <div>
            <div>
                <form onSubmit={handleSubmit}>
                    <Input
                        label="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        error={username && !usernameRegex.test(username) ? "Username must have a captial letter and a number" : ""}
                    />
                    <Input
                        label="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email"
                        error={email && !email.includes("@") ? "Invalid email" : ""}
                    />
                    <Input
                        label="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"
                        error={password && !passwordRegex.test(password) ? "Password must have 1 capital letter, 1 number, 1 special character, and at least 10 characters" : ""}
                    />
                    <Input
                        label="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First Name"
                    />
                    <Input
                        label="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last Name"
                    />
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>
    )
}
export default Register