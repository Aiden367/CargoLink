import React, { useState } from 'react';
import { Input } from '../components/common/Input';
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";
import { Package, Truck, ArrowRight, CheckCircle } from 'lucide-react';
import '../styles/Register.css';

const Register = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const usernameRegex = /^(?=.*[A-Z])(?=.*\d).+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{10,}$/;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const userData = { username, email, password, firstName, lastName };

        try {
            const response = await axios.get("http://localhost:5000/user/GetAllUsers");
            const users = response.data;
            const usernameExists = users.some(u => u.username === userData.username);
            
            if (usernameExists) {
                setError("Username already exists. Please choose another.");
                setLoading(false);
                return;
            }
        } catch (err) {
            console.error(err);
        }

        try {
            const response = await axios.post("http://localhost:5000/user/Register", userData);
            console.log("User Created", response.data);
            navigate("/login");
        } catch (err) {
            console.error(err);
            setError("Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="register-container">
            <div className="register-sidebar">
                <div className="sidebar-content-register">
                    <div className="logo-section-register">
                        <div className="logo-icon-register">
                            <Truck size={40} />
                        </div>
                        <h1 className="logo-text-register">SwiftTrack</h1>
                        <p className="logo-tagline-register">Join Our Logistics Network</p>
                    </div>
                    
                    <div className="benefits-register">
                        <h3 className="benefits-title-register">Why Join SwiftTrack?</h3>
                        <div className="benefit-item-register">
                            <CheckCircle size={20} />
                            <span>Real-time package tracking</span>
                        </div>
                        <div className="benefit-item-register">
                            <CheckCircle size={20} />
                            <span>Efficient route optimization</span>
                        </div>
                        <div className="benefit-item-register">
                            <CheckCircle size={20} />
                            <span>Advanced analytics dashboard</span>
                        </div>
                        <div className="benefit-item-register">
                            <CheckCircle size={20} />
                            <span>24/7 customer support</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="register-main">
                <div className="register-card">
                    <div className="register-header">
                        <h2>Create Account</h2>
                        <p>Get started with your logistics management</p>
                    </div>

                    {error && (
                        <div className="error-banner">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="register-form">
                        <div className="form-row-register">
                            <input
                                label="First Name"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                                required
                            />
                            <input
                                label="Last Name"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Doe"
                                required
                            />
                        </div>

                        <input
                            label="Username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="JohnDoe123"
                            error={username && !usernameRegex.test(username) ? "Username must have a capital letter and a number" : ""}
                            required
                        />

                        <input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john.doe@example.com"
                            error={email && !email.includes("@") ? "Invalid email" : ""}
                            required
                        />

                        <input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a strong password"
                            error={password && !passwordRegex.test(password) ? "Password must have 1 capital letter, 1 number, 1 special character, and at least 10 characters" : ""}
                            required
                        />

                        <div className="password-requirements-register">
                            <p className="requirements-title-register">Password must contain:</p>
                            <ul>
                                <li className={password.length >= 10 ? "valid" : ""}>
                                    At least 10 characters
                                </li>
                                <li className={/[A-Z]/.test(password) ? "valid" : ""}>
                                    One uppercase letter
                                </li>
                                <li className={/\d/.test(password) ? "valid" : ""}>
                                    One number
                                </li>
                                <li className={/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password) ? "valid" : ""}>
                                    One special character
                                </li>
                            </ul>
                        </div>

                        <label className="terms-checkbox-register">
                            <input type="checkbox" required />
                            <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
                        </label>

                        <button 
                            type="submit" 
                            className="submit-btn-register"
                            disabled={loading}
                        >
                            {loading ? (
                                <span>Creating Account...</span>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="register-footer">
                        <p>Already have an account? <Link to="/login">Sign in</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;