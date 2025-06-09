import React, { useState } from 'react';
import TailwindCard from './TailwindCard';

const TailwindDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    // Sample data for the dashboard
    const stats = [
        { id: 1, name: 'Total Queries', value: '1,284', change: '+12.5%', trend: 'up' },
        { id: 2, name: 'Avg. Response Time', value: '235ms', change: '-18.2%', trend: 'down' },
        { id: 3, name: 'Success Rate', value: '98.5%', change: '+2.1%', trend: 'up' },
        { id: 4, name: 'Data Processed', value: '1.2TB', change: '+24.0%', trend: 'up' },
    ];

    const recentQueries = [
        { id: 1, name: 'Monthly Sales Analysis', date: '2 hours ago', status: 'completed' },
        { id: 2, name: 'Customer Demographics', date: '5 hours ago', status: 'completed' },
        { id: 3, name: 'Inventory Forecast', date: '1 day ago', status: 'failed' },
        { id: 4, name: 'Marketing Campaign Results', date: '2 days ago', status: 'completed' },
    ];

    return (
        <div className="py-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
                <p className="text-gray-600">Welcome to your data analysis workspace</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex -mb-px">
                    {['overview', 'queries', 'data', 'settings'].map((tab) => (
                        <button
                            key={tab}
                            className={`
                py-4 px-6 font-medium text-sm border-b-2 transition-colors duration-200
                ${activeTab === tab
                                    ? 'border-[#3f51b5] text-[#3f51b5]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <TailwindCard key={stat.id} className="h-full">
                        <div className="flex flex-col h-full">
                            <h3 className="text-lg text-gray-500 font-medium">{stat.name}</h3>
                            <div className="mt-2 flex items-baseline">
                                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                                <span
                                    className={`
                    ml-2 text-sm font-medium flex items-center
                    ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}
                  `}
                                >
                                    {stat.change}
                                    {stat.trend === 'up' ? (
                                        <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </span>
                            </div>
                        </div>
                    </TailwindCard>
                ))}
            </div>

            {/* Recent Queries */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TailwindCard title="Recent Queries">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentQueries.map((query) => (
                                        <tr key={query.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{query.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{query.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${query.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        `}>
                                                    {query.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                <button className="text-[#3f51b5] hover:text-[#303f9f] font-medium">View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TailwindCard>
                </div>

                <div>
                    <TailwindCard title="Quick Actions">
                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-[#3f51b5] hover:bg-[#303f9f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3f51b5]">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                New Query
                            </button>

                            <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3f51b5]">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                </svg>
                                Import Data
                            </button>

                            <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3f51b5]">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Generate Report
                            </button>
                        </div>
                    </TailwindCard>
                </div>
            </div>
        </div>
    );
};

export default TailwindDashboard;