import React, { useState } from 'react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = () => {
    const [credentials, setCredentials] = useState({
        identifier: '', // Can be email or username
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await api.login(credentials.identifier, credentials.password);

            if (result.success) {
                // Redirect to dashboard on successful login
                navigate('/dashboard');
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred during login');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Login</h2>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="identifier">Email or Username</label>
                        <input
                            type="text"
                            id="identifier"
                            name="identifier"
                            value={credentials.identifier}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Enter your email or username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>

                <div className="login-footer">
                    <p>Don't have an account? <a href="/register">Register</a></p>
                </div>
            </div>
        </div>
    );
};

export default Login;