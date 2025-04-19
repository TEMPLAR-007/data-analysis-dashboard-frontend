import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="logo">Data Analysis Dashboard</div>
            <ul className="nav-links">
                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/queries">Queries</Link></li>
                <li><Link to="/analysis">Analysis</Link></li>
                <li><Link to="/settings">Settings</Link></li>
            </ul>
        </nav>
    );
};

export default Navbar;
