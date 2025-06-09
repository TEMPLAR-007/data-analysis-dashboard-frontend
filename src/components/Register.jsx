import React, { useState } from 'react';
import { api } from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Remove confirmPassword before sending to API
            const { confirmPassword, ...userData } = formData;  // eslint-disable-line no-unused-vars

            const result = await api.register(userData);

            if (result.success) {
                // Redirect to login page after successful registration
                navigate('/login', {
                    state: { message: 'Registration successful. Please log in.' }
                });
            } else {
                setError(result.message || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred during registration');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-center text-gray-900 mb-6">Create Account</h2>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900
                                     focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                     disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            minLength="3"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900
                                     focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                     disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
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
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            minLength="8"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900
                                     focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                     disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            minLength="8"
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
                            {loading ? 'Creating Account...' : 'Register'}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;