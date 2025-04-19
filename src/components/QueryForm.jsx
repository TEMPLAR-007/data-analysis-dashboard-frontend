import { useState, useEffect } from 'react';
import api from '../utils/api';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import AnalysisForm from './AnalysisForm';
import AnalysisHistory from './AnalysisHistory';

const QueryForm = ({ onQuerySaved }) => {
    const [userQuery, setUserQuery] = useState('');
    const [savedQueries, setSavedQueries] = useState([]);
    const [displayedQueries, setDisplayedQueries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
    const [selectedQueries, setSelectedQueries] = useState([]);
    const [showAnalysisForm, setShowAnalysisForm] = useState(false);

    const exampleQueries = [
        "What is the total amount spent in each category",
        "Show me the distribution of orders by payment method",
        "What are the top 3 products by total sales",
        "How many orders are completed, canceled, or refunded",
        "What is the average quantity ordered per customer"
    ];

    // Pie chart colors
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    // Fetch saved queries on component mount
    useEffect(() => {
        fetchSavedQueries();
    }, []);

    // Load all queries when saved queries change
    useEffect(() => {
        loadAllQueryDetails();
    }, [savedQueries]);

    const fetchSavedQueries = async () => {
        setIsLoading(true);
        try {
            const result = await api.getAllSavedQueries();
            if (result.success) {
                setSavedQueries(result.queries || []);
            } else {
                setError('Failed to load query history');
            }
        } catch (err) {
            setError('Error loading queries: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAllQueryDetails = async () => {
        if (!savedQueries.length) return;

        setIsLoading(true);
        try {
            const queriesWithDetails = await Promise.all(
                savedQueries.map(async (query) => {
                    try {
                        // Check what property contains the query ID
                        const queryId = query.id || query.query_id;
                        const details = await api.getSavedQueryDetails(queryId);
                        if (details.success) {
                            // Normalize query object to ensure it has original_query field
                            return normalizeQueryObject(details);
                        }
                        return null;
                    } catch (err) {
                        console.error(`Error loading details for query:`, err, query);
                        return null;
                    }
                })
            );

            const validQueries = queriesWithDetails.filter(q => q !== null);
            setDisplayedQueries(validQueries);
        } catch (err) {
            console.error('Error loading query details:', err);
            setError('Error loading query details: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to normalize query objects ensuring consistent field names
    const normalizeQueryObject = (queryObj) => {
        if (!queryObj) return queryObj;

        // Check for nested query object that contains the actual query details
        if (queryObj.query && typeof queryObj.query === 'object') {
            // If the response has a nested query object structure, extract the original query text
            if (queryObj.query.original_query && !queryObj.original_query) {
                queryObj.original_query = queryObj.query.original_query;
            }

            // If filtered_data is missing but exists in results, copy it
            if (!queryObj.filtered_data && queryObj.query.results) {
                queryObj.filtered_data = queryObj.query.results;
            }
        }

        // Find a query text from various possible fields
        const queryText =
            queryObj.original_query ||
            (queryObj.query && queryObj.query.original_query) ||
            queryObj.userQuery ||
            queryObj.query ||
            queryObj.text ||
            queryObj.question ||
            (queryObj.details && queryObj.details.query);

        // Ensure the object has an original_query field with the found text
        if (queryText && !queryObj.original_query) {
            queryObj.original_query = queryText;
        }

        // Make sure filtered_data exists
        if (!queryObj.filtered_data && queryObj.results) {
            queryObj.filtered_data = queryObj.results;
        }

        return queryObj;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userQuery.trim()) return;

        await processQuery(userQuery);
    };

    const handleExampleClick = (query) => {
        setUserQuery(query);
        processQuery(query);
    };

    const processQuery = async (query) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await api.processQuery({
                userQuery: query
            });

            if (result.success) {
                // If the query text isn't stored in result, add it
                if (!result.original_query && query) {
                    result.original_query = query;
                }

                // Refresh all queries instead of just adding one
                setUserQuery('');
                fetchSavedQueries();
                // Only call onQuerySaved for analysis, not for regular queries
                // if (onQuerySaved) onQuerySaved(result.query_id);
            } else {
                setError(result.message || 'Failed to process query');
            }
        } catch (err) {
            setError('Error processing query: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseQuery = async (index) => {
        try {
            const queryToDelete = displayedQueries[index];
            if (!queryToDelete) return;

            // Determine the query ID to delete
            const queryId = queryToDelete.query_id ||
                (queryToDelete.query && queryToDelete.query.id) ||
                queryToDelete.id;

            if (!queryId) {
                console.error("Could not find ID for query to delete");
                setPendingDeleteIndex(null);
                return;
            }

            // Show loading state
            setIsLoading(true);

            // Call API to delete the query permanently
            const result = await api.deleteQuery(queryId);

            if (result.success) {
                // Remove from display if successful
                setDisplayedQueries(prev => prev.filter((_, i) => i !== index));
                // Refresh the saved queries list
                fetchSavedQueries();
            } else {
                setError(`Failed to delete query: ${result.message || 'Unknown error'}`);
            }
        } catch (err) {
            setError(`Error deleting query: ${err.message}`);
            console.error("Error deleting query:", err);
        } finally {
            setIsLoading(false);
            setPendingDeleteIndex(null); // Clear the pending delete index
        }
    };

    const handleChangeChartType = (index, chartType) => {
        setDisplayedQueries(prev =>
            prev.map((q, i) => i === index ? { ...q, preferredChartType: chartType } : q)
        );
    };

    // Add this function to format chart placeholders in a simple way matching the screenshot
    const renderSimplePlaceholderChart = (type, title, dataPoints) => {
        return (
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                border: '1px solid #e1e9ff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '150px',
                textAlign: 'center'
            }}>
                <div style={{
                    color: '#1a73e8',
                    fontWeight: '500',
                    marginBottom: '1rem'
                }}>
                    {title}
                </div>

                {type.toLowerCase() === 'metrics' ? (
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#202124'
                    }}>
                        N/A
                    </div>
                ) : (
                    <div>
                        <div style={{
                            fontStyle: 'italic',
                            marginBottom: '0.5rem'
                        }}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </div>
                        {dataPoints && (
                            <div style={{ fontSize: '0.9rem', color: '#5f6368' }}>
                                {dataPoints} data points
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Update the renderDashboardFromResponse function to display real charts from the API data
    const renderDashboardFromResponse = (response) => {
        // Check if we have a valid response with dashboard data
        if (!response || !response.success) return null;

        // Get dashboard data - works with different API response formats
        const dashboardData = response.dashboard || response.data?.dashboard || response.results?.dashboard || response;

        console.log("Dashboard data:", dashboardData);

        if (!dashboardData) return null;

        // Colors for charts
        const CHART_COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#FF8042', '#9C27B0', '#82ca9d'];

        // Helper to render an HTML bar chart directly without using ReCharts
        const renderHtmlBarChart = (chartData) => {
            console.log("Rendering HTML bar chart with data:", chartData);

            if (!chartData || !chartData.data || !chartData.data.labels || !chartData.data.values) {
                console.log("Invalid chart data, using placeholder");
                return renderSimplePlaceholderChart('bar', chartData?.title || 'Bar Chart', 5);
            }

            try {
                const labels = chartData.data.labels;
                const values = chartData.data.values;
                const colors = chartData.data.colors || ['#4CAF50', '#2196F3', '#FFC107', '#FF8042', '#9C27B0', '#82ca9d'];
                const maxValue = Math.max(...values);

                // Format currency values
                const formatValue = (val) => {
                    // Use comma formatting and add $ for currency values
                    return '$' + new Intl.NumberFormat().format(val);
                };

                return (
                    <div style={{ width: '100%', height: '300px', position: 'relative' }}>
                        {/* Chart area with borders */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 30,
                            left: 50,
                            display: 'flex',
                            alignItems: 'flex-end',
                            borderLeft: '1px solid #e2e8f0',
                            borderBottom: '1px solid #e2e8f0'
                        }}>
                            {labels.map((label, index) => {
                                const value = values[index] || 0;
                                const percentage = (value / maxValue) * 100;

                                return (
                                    <div key={index} style={{
                                        flex: 1,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        padding: '0 4px'
                                    }}>
                                        <div
                                            style={{
                                                width: '70%',
                                                height: `${percentage}%`,
                                                backgroundColor: colors[index % colors.length],
                                                borderRadius: '4px 4px 0 0',
                                                minHeight: '4px',
                                                position: 'relative',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '0.8';
                                                const tooltip = e.currentTarget.querySelector('.tooltip');
                                                if (tooltip) tooltip.style.opacity = '1';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                                const tooltip = e.currentTarget.querySelector('.tooltip');
                                                if (tooltip) tooltip.style.opacity = '0';
                                            }}
                                        >
                                            <div className="tooltip" style={{
                                                position: 'absolute',
                                                top: '-30px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                whiteSpace: 'nowrap',
                                                opacity: 0,
                                                transition: 'opacity 0.2s'
                                            }}>
                                                {chartData.data.tooltips?.[index] || formatValue(value)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Y-axis with values */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 30,
                            width: '50px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            padding: '0 8px 0 0',
                            fontSize: '0.75rem',
                            color: '#64748b'
                        }}>
                            <div>{formatValue(maxValue)}</div>
                            <div>{formatValue(maxValue * 0.75)}</div>
                            <div>{formatValue(maxValue * 0.5)}</div>
                            <div>{formatValue(maxValue * 0.25)}</div>
                            <div>$0</div>
                        </div>

                        {/* X-axis with labels */}
                        <div style={{
                            position: 'absolute',
                            left: 50,
                            right: 0,
                            bottom: 0,
                            height: '30px',
                            display: 'flex'
                        }}>
                            {labels.map((label, index) => (
                                <div key={index} style={{
                                    flex: 1,
                                    padding: '8px 4px 0',
                                    textAlign: 'center',
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {label}
                                </div>
                            ))}
                        </div>

                        {/* Chart description */}
                        {chartData.context?.description && (
                            <div style={{
                                position: 'absolute',
                                bottom: '-25px',
                                left: 0,
                                right: 0,
                                fontSize: '0.75rem',
                                color: '#64748b',
                                textAlign: 'center',
                                fontStyle: 'italic'
                            }}>
                                {chartData.context.description}
                            </div>
                        )}
                    </div>
                );
            } catch (error) {
                console.error("Error rendering bar chart:", error);

                // If chart fails, use simple fallback
                return (
                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        height: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1a73e8' }}>
                            {chartData.title || 'Bar Chart'}
                        </div>
                        <div style={{ color: '#666', marginTop: '0.5rem' }}>
                            {chartData.data.labels.length} data points available
                        </div>
                    </div>
                );
            }
        };

        // Helper to render actual metrics with data from the API
        const renderMetricCards = (metricsData) => {
            if (!metricsData || !metricsData.items || metricsData.items.length === 0) {
                return renderSimplePlaceholderChart('metrics', 'Metrics', 'N/A');
            }

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {metricsData.items.map((metric, index) => (
                        <div key={index} style={{
                            backgroundColor: 'white',
                            padding: '1.25rem',
                            borderRadius: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <h3 style={{
                                margin: '0 0 0.5rem 0',
                                color: '#202124',
                                fontSize: '1rem',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#e8f0fe',
                                    color: '#1967d2',
                                    borderRadius: '50%',
                                    fontSize: '1rem'
                                }}>
                                    {metric.icon === 'attach_money' ? '$' : '📊'}
                                </span>
                                {metric.title}
                            </h3>

                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    color: '#202124'
                                }}>
                                    {metric.value}
                                </div>

                                {metric.trend && (
                                    <div style={{
                                        color: metric.trend === 'up' ? '#0f9d58' : '#d93025',
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {metric.trend === 'up' ? '↑' : '↓'}
                                    </div>
                                )}
                            </div>

                            {metric.comparison && (
                                <div style={{ fontSize: '0.875rem', color: '#5f6368' }}>
                                    <span style={{ fontWeight: '500' }}>{metric.comparison.label}:</span> {metric.comparison.value}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            );
        };

        return (
            <div>
                <h3 style={{
                    color: '#202124',
                    marginBottom: '1rem',
                    borderBottom: '1px solid #e1e9ff',
                    paddingBottom: '0.5rem',
                    fontSize: '1.2rem',
                    fontWeight: 'normal'
                }}>Visualization</h3>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    {/* Render metrics if available */}
                    {dashboardData.visualization?.components?.metrics && (
                        <div style={{
                            flexBasis: '45%',
                            flexGrow: 1
                        }}>
                            {renderMetricCards(dashboardData.visualization.components.metrics)}
                        </div>
                    )}

                    {/* Render bar chart if available */}
                    {dashboardData.visualization?.components?.barChart && (
                        <div style={{
                            flexBasis: '45%',
                            flexGrow: 1
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                border: '1px solid #e1e9ff'
                            }}>
                                <div style={{
                                    color: '#1a73e8',
                                    fontWeight: '500',
                                    marginBottom: '1rem'
                                }}>
                                    {dashboardData.visualization.components.barChart.title || 'Chart'}
                                </div>
                                {renderHtmlBarChart(dashboardData.visualization.components.barChart)}
                            </div>
                        </div>
                    )}

                    {/* If no chart components are found, render placeholders */}
                    {!dashboardData.visualization?.components?.metrics && !dashboardData.visualization?.components?.barChart && (
                        <>
                            <div style={{ flexBasis: '45%', flexGrow: 1 }}>
                                {renderSimplePlaceholderChart('metrics', 'Metrics', null)}
                            </div>
                            <div style={{ flexBasis: '45%', flexGrow: 1 }}>
                                {renderSimplePlaceholderChart('bar', 'Revenue Comparison of Electric Products', 5)}
                            </div>
                        </>
                    )}
                </div>

                {/* Insights Sections */}
                {dashboardData.insights && (
                    <div style={{ marginTop: '2rem' }}>
                        {Object.entries(dashboardData.insights).map(([key, content]) => {
                            if (!content || (Array.isArray(content) && content.length === 0)) return null;

                            // Map section keys to display titles
                            const titleMap = {
                                'insights': 'Key Insights',
                                'trends': 'Trends',
                                'findings': 'Findings',
                                'recommendations': 'Recommendations'
                            };

                            return (
                                <div key={key} style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{
                                        color: '#202124',
                                        marginBottom: '0.5rem',
                                        fontSize: '1.1rem',
                                        fontWeight: 'normal'
                                    }}>
                                        {titleMap[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                                    </h3>

                                    <ul style={{
                                        paddingLeft: '1.5rem',
                                        margin: '0.5rem 0',
                                        color: '#3c4043'
                                    }}>
                                        {Array.isArray(content) ?
                                            content.map((item, i) => (
                                                <li key={i} style={{ marginBottom: '0.5rem' }}>
                                                    {typeof item === 'string' ? item : JSON.stringify(item)}
                                                </li>
                                            )) :
                                            <li>{content}</li>
                                        }
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add event listeners for bar hover effects after rendering */}
                <div style={{ display: 'none' }} ref={el => {
                    if (el) {
                        setTimeout(() => {
                            // Get all bar elements
                            const bars = document.querySelectorAll('.bar-tooltip');
                            if (bars.length === 0) return;

                            // Add hover effect to each bar
                            bars.forEach(tooltip => {
                                const barElement = tooltip.parentElement;
                                if (!barElement) return;

                                barElement.addEventListener('mouseenter', () => {
                                    tooltip.style.opacity = '1';
                                });

                                barElement.addEventListener('mouseleave', () => {
                                    tooltip.style.opacity = '0';
                                });
                            });
                        }, 500);
                    }
                }}></div>
            </div>
        );
    };

    // Update renderChart function to use our simpler dashboard renderer
    const renderChart = (data, chartType) => {
        // If we have a response that looks like a dashboard format, use our enhanced renderer
        if (data && (data.dashboard || data.success)) {
            return renderDashboardFromResponse(data);
        }

        if (!data || data.length === 0) return null;

        // Get the first two numeric columns for charting
        const columns = Object.keys(data[0]);
        const numericColumns = columns.filter(col =>
            typeof data[0][col] === 'number' || !isNaN(parseFloat(data[0][col]))
        );

        if (numericColumns.length < 1) {
            return <div>No numeric data available for charting</div>;
        }

        const valueKey = numericColumns[0];
        const nameKey = columns.find(col => col !== valueKey) || valueKey;

        // Format the data for the chart
        const formattedData = data.map(item => ({
            name: formatColumnName(item[nameKey]),
            value: parseFloat(item[valueKey])
        }));

        // Format numbers for tooltip
        const formatValue = (value) => new Intl.NumberFormat().format(value);

        // Function to format column names
        function formatColumnName(name) {
            if (typeof name !== 'string') return name;
            return name
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }

        switch (chartType) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={formattedData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {formattedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatValue(value)} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => formatValue(value)} />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => formatValue(value)} />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                );
            default:
                return <div>Unknown chart type</div>;
        }
    };

    const renderDataTable = (data) => {
        if (!data || data.length === 0) return null;

        const formatColumnName = (name) => {
            return name
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        };

        return (
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {Object.keys(data[0]).map((header, index) => (
                                <th key={index} style={{
                                    backgroundColor: '#f8faff',
                                    padding: '0.75rem',
                                    textAlign: 'left',
                                    borderBottom: '2px solid #e1e9ff',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {formatColumnName(header)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {Object.values(row).map((cell, cellIndex) => (
                                    <td key={cellIndex} style={{
                                        padding: '0.75rem',
                                        borderBottom: '1px solid #e1e9ff',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {typeof cell === 'number' ? new Intl.NumberFormat().format(cell) : cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Function to check if data is suitable for charting
    const isChartable = (data) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return false;
        }

        // Check if we have at least two columns (category and value)
        const keys = Object.keys(data[0] || {});
        if (keys.length < 2) {
            return false;
        }

        // Check if we have numeric values in the second column
        const valueKey = keys[1];
        const hasNumericValues = data.some(item => {
            const value = item[valueKey];
            return typeof value === 'number' || !isNaN(Number(value));
        });

        // Check if we have at least 2 distinct categories
        const categoryKey = keys[0];
        const distinctCategories = new Set(data.map(item => item[categoryKey])).size;

        return hasNumericValues && distinctCategories >= 2;
    };

    const renderSummary = (query) => {
        if (!query || !query.filtered_data) return null;

        const recordCount = query.filtered_data.length;
        const formatColumnName = (name) => {
            return name
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        };

        // Format the query text for display
        const formattedQuery = query.original_query
            .split(/\b/)
            .map(word => {
                // Check if the word is a column name (contains underscore)
                if (word.includes('_')) {
                    return formatColumnName(word);
                }
                return word;
            })
            .join('');

        return (
            <div style={{
                backgroundColor: '#f8faff',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
            }}>
                <div style={{ marginBottom: '0.5rem', color: '#666' }}>
                    <strong>Results:</strong> {recordCount} {recordCount === 1 ? 'record' : 'records'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#444' }}>
                    <strong>Query:</strong> {formattedQuery}
                </div>
            </div>
        );
    };

    return (
        <div className="main-dashboard">
            <div className="dashboard-top" style={{ width: '100%', maxWidth: '100%', padding: '1rem' }}>
                <div className="query-input-card" style={{ maxWidth: '100%' }}>
                    <div className="input-wrapper">
                        <input
                            type="text"
                            value={userQuery}
                            onChange={(e) => setUserQuery(e.target.value)}
                            placeholder="Ask a question about your data..."
                            className="query-input"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !userQuery.trim()}
                            className="run-query-btn"
                        >
                            {isLoading ? 'Processing...' : 'Run Query'}
                        </button>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="example-queries-section">
                        <p className="example-label">Example queries:</p>
                        <div className="example-tags">
                            {exampleQueries.map((query, index) => (
                                <button
                                    key={index}
                                    className="example-tag"
                                    onClick={() => handleExampleClick(query)}
                                >
                                    "{query}"
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                {selectedQueries.length > 0 && (
                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#f8faff',
                        borderBottom: '1px solid #e1e9ff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <span style={{ fontWeight: 500 }}>
                                {selectedQueries.length} {selectedQueries.length === 1 ? 'query' : 'queries'} selected
                            </span>
                        </div>
                        <button
                            onClick={() => setShowAnalysisForm(true)}
                            style={{
                                backgroundColor: '#1a73e8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span>Analyze Selected Queries</span>
                        </button>
                    </div>
                )}

                {showAnalysisForm && (
                    <AnalysisForm
                        queryIds={selectedQueries}
                        onClose={() => setShowAnalysisForm(false)}
                        onAnalysisComplete={(results) => {
                            if (onQuerySaved) onQuerySaved({ type: 'analysis', results });
                            setShowAnalysisForm(false);
                        }}
                    />
                )}

                <div className="dashboard-main">
                    <div className="results-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '1.5rem',
                        width: '100%',
                        maxWidth: '100%',
                        padding: '0 1rem'
                    }}>
                        {isLoading && displayedQueries.length === 0 ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>Loading your queries...</p>
                            </div>
                        ) : displayedQueries.length === 0 ? (
                            <div className="no-queries-message">
                                <p>No queries to display</p>
                                <p className="hint-text">Enter a new query or try one of the example queries above</p>
                            </div>
                        ) : (
                            displayedQueries.map((query, index) => {
                                console.log("Rendering query result:", query); // Debug log
                                // Look for query text in multiple possible locations including nested query object
                                const queryText =
                                    query.original_query ||
                                    (query.query && query.query.original_query) ||
                                    query.userQuery ||
                                    query.query ||
                                    query.text ||
                                    query.question ||
                                    (query.details && query.details.query);
                                return (
                                    <div className="result-card" key={index} style={{
                                        marginBottom: '1rem',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        minHeight: '400px',
                                        maxHeight: '600px',
                                        width: '100%',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #e1e9ff'
                                    }}>
                                        <div className="result-header" style={{
                                            padding: '0.5rem 0.75rem',
                                            backgroundColor: '#f8faff',
                                            borderBottom: '1px solid #e1e9ff',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedQueries.includes(query.id || query.query_id)}
                                                    onChange={(e) => {
                                                        const queryId = query.id || query.query_id;
                                                        if (e.target.checked) {
                                                            setSelectedQueries([...selectedQueries, queryId]);
                                                        } else {
                                                            setSelectedQueries(selectedQueries.filter(id => id !== queryId));
                                                        }
                                                    }}
                                                    style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                                <h3 style={{
                                                    color: '#1a73e8',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold',
                                                    margin: '0',
                                                    padding: '0.25rem 0',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '250px'
                                                }}>
                                                    Query: {queryText ? `"${queryText}"` : "No query text available"}
                                                </h3>
                                            </div>
                                            <div className="result-actions" style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                {isChartable(query.filtered_data) && (
                                                    <select
                                                        value={query.preferredChartType || (query.chart_data ? query.chart_data.type : 'bar')}
                                                        onChange={(e) => handleChangeChartType(index, e.target.value)}
                                                        className="chart-type-select"
                                                        style={{ fontSize: '0.85rem', padding: '0.15rem' }}
                                                    >
                                                        <option value="bar">Bar Chart</option>
                                                        <option value="pie">Pie Chart</option>
                                                        <option value="line">Line Chart</option>
                                                    </select>
                                                )}
                                                <button
                                                    className="close-result"
                                                    onClick={() => setPendingDeleteIndex(index)}
                                                    style={{
                                                        fontSize: '1rem',
                                                        padding: '0 0.25rem',
                                                        display: 'block',
                                                        marginLeft: '0.5rem',
                                                        backgroundColor: '#f5f5f5',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        width: '24px',
                                                        height: '24px',
                                                        lineHeight: '1',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        </div>

                                        {pendingDeleteIndex === index && (
                                            <div style={{
                                                backgroundColor: '#fef8f8',
                                                padding: '0.75rem',
                                                borderTop: '1px solid #ffcdd2',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '0.9rem',
                                                    color: '#d32f2f'
                                                }}>
                                                    Delete this query permanently?
                                                </p>
                                                <div>
                                                    <button
                                                        onClick={() => handleCloseQuery(index)}
                                                        style={{
                                                            backgroundColor: '#d32f2f',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: '0.4rem 0.75rem',
                                                            marginRight: '0.5rem',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                    <button
                                                        onClick={() => setPendingDeleteIndex(null)}
                                                        style={{
                                                            backgroundColor: '#f5f5f5',
                                                            color: '#333',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px',
                                                            padding: '0.4rem 0.75rem',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="result-content" style={{
                                            padding: '0.5rem 0.75rem',
                                            flex: 1,
                                            overflow: 'auto'
                                        }}>
                                            {query.filtered_data && query.filtered_data.length > 0 ? (
                                                <div className="result-data-container" style={{ gap: '0.5rem' }}>
                                                    {isChartable(query.filtered_data) && (
                                                        <div className="chart-container" style={{
                                                            padding: '0.75rem',
                                                            height: query.filtered_data.length > 8 ? '300px' : '250px',
                                                            backgroundColor: '#f9fafc',
                                                            borderRadius: '6px',
                                                            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            marginBottom: '1rem'
                                                        }}>
                                                            {renderChart(query.filtered_data, query.preferredChartType || 'bar')}
                                                        </div>
                                                    )}

                                                    <div style={{
                                                        backgroundColor: '#f0f7ff',
                                                        borderRadius: '6px',
                                                        padding: '0.75rem 1rem',
                                                        margin: '0.5rem 0',
                                                        borderLeft: '4px solid #4285f4'
                                                    }}>
                                                        <h4 style={{
                                                            margin: '0 0 0.25rem 0',
                                                            color: '#4285f4',
                                                            fontSize: '1rem'
                                                        }}>Summary</h4>

                                                        {/* Display API answer if available */}
                                                        {query.answer && (
                                                            <p style={{
                                                                margin: '0.25rem 0',
                                                                fontSize: '0.95rem',
                                                                lineHeight: '1.4',
                                                                color: '#000',
                                                                fontWeight: '500',
                                                                backgroundColor: '#e8f0fe',
                                                                padding: '0.4rem 0.5rem',
                                                                borderRadius: '4px'
                                                            }}>
                                                                {query.answer}
                                                            </p>
                                                        )}

                                                        {renderSummary(query)}
                                                    </div>

                                                    {renderDataTable(query.filtered_data)}
                                                </div>
                                            ) : (
                                                <p className="no-data">No data available for this query</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueryForm;