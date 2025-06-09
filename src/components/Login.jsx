import React, { useState } from 'react';
import { api } from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-center text-gray-900 mb-6">Login</h2>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                            Email or Username
                        </label>
                        <input
                            type="text"
                            id="identifier"
                            name="identifier"
                            value={credentials.identifier}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Enter your email or username"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900
                                     focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                     disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900
                                     focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                     disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>

                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white
                                     bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                                     focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;