import React, { useState } from 'react';
import { Input } from '../components/common/Input';
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";
import { Package, Truck, ArrowRight } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        const userLoginData = { email, password };
        
        try {
            const response = await axios.post("http://localhost:5000/user/Login", userLoginData);
            console.log("Login Successful", response.data);
            localStorage.setItem("accessToken", response.data.accessToken);
            navigate("/home");
        } catch (err) {
            console.error("Login Failed", err.message);
            setError("Invalid email or password. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="login-sidebar">
                <div className="sidebar-content-login">
                    <div className="logo-section-login">
                        <div className="logo-icon-login">
                            <Truck size={40} />
                        </div>
                        <h1 className="logo-text-login">SwiftTrack</h1>
                        <p className="logo-tagline-login">Logistics Management System</p>
                    </div>
                    
                    <div className="features-login">
                        <div className="feature-item-login">
                            <Package size={24} />
                            <div>
                                <h3>Real-time Tracking</h3>
                                <p>Monitor your deliveries in real-time</p>
                            </div>
                        </div>
                        <div className="feature-item-login">
                            <Truck size={24} />
                            <div>
                                <h3>Fleet Management</h3>
                                <p>Manage drivers and vehicles efficiently</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-main">
                <div className="login-card">
                    <div className="login-header">
                        <h2>Welcome Back</h2>
                        <p>Sign in to your account to continue</p>
                    </div>

                    {error && (
                        <div className="error-banner">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            error={email && !email.includes("@") ? "Invalid email" : ""}
                            required
                        />
                        
                        <input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />

                        <div className="form-options-login">
                            <label className="remember-me-login">
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="forgot-password-login">Forgot password?</a>
                        </div>

                        <button 
                            type="submit" 
                            className="submit-btn-login"
                            disabled={loading}
                        >
                            {loading ? (
                                <span>Signing in...</span>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Don't have an account <Link to="/register">Sign up</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;