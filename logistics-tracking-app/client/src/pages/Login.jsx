import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../components/common/Input'

function DoCalculation() {
    const firstName = "aiden"
    const secondName = "carli"
    const thirdName = "john"

    const names = [firstName, secondName, thirdName]

    for (let i = 0; i < names.length; i++) {
        console.log(names[i]);
    }
}

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
    //const jellyBeanColour = "green"
    const [username, setUsername] = useState("");
    const [submittedData, setSubmittedData] = useState("");
    const handleSubmit = (e) => {
        e.preventDefault()
        const formData = {
            email: email,
            username: username,
        }

        setSubmittedData(formData);
    }

    return (
        <div>
            <div>
                <CombineUsernames/>
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
                        label="Username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter Username"
                    />
                    <button type="submit">Submit</button>
                </form>
                {submittedData && (
                    <div>
                        <h3>Submitted Data:</h3>
                        <p>email: {submittedData.email}</p>
                        <p>Username: {submittedData.username}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
export default Login;