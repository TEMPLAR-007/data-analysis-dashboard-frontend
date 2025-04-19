import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDate } from '../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ResultsViewer = ({ analysisResults }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!analysisResults || !analysisResults.results) {
        return <div className="no-results">No analysis results to display</div>;
    }

    const {
        performance_overview,
        visual_analysis,
        key_insights,
        recommendations,
        metadata
    } = analysisResults.results;

    return (
        <div className="results-viewer">
            <div className="results-header">
                <h2>Analysis Results</h2>
                <div className="metadata">
                    <span>Analysis Type: {metadata?.analysis_type || 'Not specified'}</span>
                    <span>Processing Time: {metadata?.processing_time || 'N/A'}</span>
                    <span>Created: {formatDate(metadata?.timestamp)}</span>
                </div>
            </div>

            <div className="tabs">
                <button
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={activeTab === 'visuals' ? 'active' : ''}
                    onClick={() => setActiveTab('visuals')}
                >
                    Visualizations
                </button>
                <button
                    className={activeTab === 'insights' ? 'active' : ''}
                    onClick={() => setActiveTab('insights')}
                >
                    Insights
                </button>
                <button
                    className={activeTab === 'recommendations' ? 'active' : ''}
                    onClick={() => setActiveTab('recommendations')}
                >
                    Recommendations
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        {performance_overview?.tables?.map((table, index) => (
                            <div key={index} className="table-container">
                                <h3>{table.title}</h3>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            {table.headers.map((header, i) => (
                                                <th key={i}>{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {table.rows.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {Object.values(row).map((cell, cellIndex) => (
                                                    <td key={cellIndex}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}

                        <div className="metrics-container">
                            {performance_overview?.metrics?.map((metric, index) => (
                                <div key={index} className="metric-card">
                                    <h4>{metric.title}</h4>
                                    <div className="metric-value">{metric.value}</div>
                                    <div className={`metric-trend ${metric.trend}`}>
                                        {metric.change}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'visuals' && (
                    <div className="visuals-tab">
                        {visual_analysis?.charts?.map((chart, index) => (
                            <div key={index} className="chart-container">
                                <h3>{chart.title}</h3>
                                {chart.type === 'bar' && (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={chart.data.labels.map((label, i) => ({
                                            name: label,
                                            value: chart.data.datasets[0].data[i]
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="value" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}

                                {chart.type === 'pie' && (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <PieChart>
                                            <Pie
                                                data={chart.data.labels.map((label, i) => ({
                                                    name: label,
                                                    value: chart.data.datasets[0].data[i]
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={150}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {chart.data.labels.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'insights' && (
                    <div className="insights-tab">
                        {key_insights?.tables?.map((table, index) => (
                            <div key={index} className="table-container">
                                <h3>{table.title}</h3>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            {table.headers.map((header, i) => (
                                                <th key={i}>{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {table.rows.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {Object.values(row).map((cell, cellIndex) => (
                                                    <td key={cellIndex}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'recommendations' && (
                    <div className="recommendations-tab">
                        {recommendations?.tables?.map((table, index) => (
                            <div key={index} className="table-container">
                                <h3>{table.title}</h3>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            {table.headers.map((header, i) => (
                                                <th key={i}>{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {table.rows.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {Object.values(row).map((cell, cellIndex) => (
                                                    <td key={cellIndex}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultsViewer;
