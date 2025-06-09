import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import AnalysisForm from './AnalysisForm';
import AnalysisHistory from './AnalysisHistory';
import DataTable from './ui/DataTable';
import Card from './ui/Card';
import Button from './ui/Button';

const QueryForm = ({ onQuerySaved }) => {
    const [userQuery, setUserQuery] = useState('');
    const [savedQueries, setSavedQueries] = useState([]);
    const [displayedQueries, setDisplayedQueries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
    const [selectedQueries, setSelectedQueries] = useState([]);
    const [showAnalysisForm, setShowAnalysisForm] = useState(false);
    const [queryFilter, setQueryFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [activeTab, setActiveTab] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedQueryIndex, setSelectedQueryIndex] = useState(null);

    const exampleQueries = [
        "What is the total amount spent in each category",
        "Show me the distribution of orders by payment method",
        "What are the top 3 products by total sales",
        "How many orders are completed, canceled, or refunded",
        "What is the average quantity ordered per customer"
    ];

    // Pie chart colors - updating with a more modern and vibrant color palette
    const COLORS = [
        '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0',
        '#4895ef', '#560bad', '#b5179e', '#f15bb5', '#00b4d8',
        '#0077b6', '#023e8a', '#03045e', '#d00000', '#ffbe0b'
    ];

    // Gradient colors for charts
    const GRADIENT_COLORS = {
        blue: ['#4361ee', '#4895ef'],
        purple: ['#7209b7', '#560bad'],
        pink: ['#f72585', '#f15bb5'],
        teal: ['#4cc9f0', '#00b4d8']
    };

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
        setError(null);
        try {
            const result = await api.getAllSavedQueries();
            console.log('Saved queries result:', result);

            if (result.success) {
                // Handle different response formats
                const queries = result.queries || result.data || [];
                setSavedQueries(queries);

                if (queries.length === 0) {
                    console.log('No saved queries found for this user');
                }
            } else {
                console.error('Failed to load query history:', result.message);
                setError(result.message || 'Failed to load query history');
            }
        } catch (err) {
            console.error('Error loading queries:', err);
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

        console.log('Normalizing query object:', queryObj);

        // Handle table_name with user prefixes
        if (queryObj.table_name) {
            // Extract the actual table name without user prefix
            const tableName = queryObj.table_name;
            const match = tableName.match(/^user_[a-z0-9]+_(.+)$/i);

            if (match && match[1]) {
                // Store the user-prefixed name but display the friendly name
                queryObj.original_table_name = tableName;
                queryObj.display_table_name = match[1];
            } else {
                queryObj.display_table_name = tableName;
            }
        }

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
            const queryToDelete = filteredAndSortedQueries[index];
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
                setDisplayedQueries(prev => prev.filter(q => {
                    const id = q.query_id || q.id;
                    return id !== queryId;
                }));
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

    // Function to filter and sort queries
    const getFilteredAndSortedQueries = () => {
        if (!displayedQueries.length) return [];

        // First filter by search term
        let filtered = displayedQueries;
        if (queryFilter) {
            const lowerFilter = queryFilter.toLowerCase();
            filtered = displayedQueries.filter(query => {
                const queryText = query.original_query || '';
                const tableName = query.display_table_name || query.table_name || '';
                return queryText.toLowerCase().includes(lowerFilter) ||
                    tableName.toLowerCase().includes(lowerFilter);
            });
        }

        // Then filter by tab
        if (activeTab === 'recent') {
            // Get queries from last 24 hours
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            filtered = filtered.filter(query => {
                const timestamp = new Date(query.timestamp || query.created_at || Date.now());
                return timestamp > oneDayAgo;
            });
        } else if (activeTab === 'chartable') {
            // Get queries that can be visualized
            filtered = filtered.filter(query => isChartable(query.filtered_data));
        }

        // Then sort
        return [...filtered].sort((a, b) => {
            const dateA = new Date(a.timestamp || a.created_at || 0);
            const dateB = new Date(b.timestamp || b.created_at || 0);

            if (sortOrder === 'newest') {
                return dateB - dateA;
            } else if (sortOrder === 'oldest') {
                return dateA - dateB;
            } else if (sortOrder === 'records') {
                const recordsA = a.filtered_data?.length || 0;
                const recordsB = b.filtered_data?.length || 0;
                return recordsB - recordsA;
            }
            return 0;
        });
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

    // Get the filtered and sorted queries
    const filteredAndSortedQueries = getFilteredAndSortedQueries();

    // Get the currently selected query for the modal
    const selectedQuery = selectedQueryIndex !== null ? filteredAndSortedQueries[selectedQueryIndex] : null;

    // Render data table with our enhanced DataTable component
    const renderDataTable = (data) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return null;
        }

        // Create columns configuration for the DataTable
        const columns = Object.keys(data[0]).map(key => ({
            id: key,
            header: formatColumnName(key),
            accessor: key,
            sortable: true
        }));

        // Determine appropriate page size options based on data size
        const pageSizeOptions = (() => {
            const dataLength = data.length;
            if (dataLength <= 10) return [5, 10];
            if (dataLength <= 25) return [5, 10, 25];
            if (dataLength <= 50) return [10, 25, 50];
            return [10, 25, 50, 100];
        })();

        return (
            <div className="w-full" onClick={(e) => e.stopPropagation()}>
                <DataTable
                    columns={columns}
                    data={data}
                    title="Data Results"
                    compact={true}
                    pageSizeOptions={pageSizeOptions}
                    className="shadow-sm"
                />
            </div>
        );
    };

    // Format column name for display
    const formatColumnName = (name) => {
        if (!name || typeof name !== 'string') return '';
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Render chart based on data and type
    const renderChart = (data, chartType = 'bar', isModal = false) => {
        if (!data || !Array.isArray(data) || data.length === 0) return null;

        const keys = Object.keys(data[0]);
        if (keys.length < 2) return null;

        const categoryKey = keys[0];
        const valueKey = keys[1];

        // Format values for display
        const formatValue = (value) => new Intl.NumberFormat().format(value);

        // Prepare chart data
        const chartData = data.map(item => ({
            name: String(item[categoryKey]),
            value: Number(item[valueKey])
        }));

        // Custom tooltip styling
        const CustomTooltip = ({ active, payload }) => {
            if (active && payload && payload.length) {
                return (
                    <div className="custom-tooltip">
                        <p className="tooltip-label">{`${payload[0].name}`}</p>
                        <p className="tooltip-value">
                            <span className="value-label">Value:</span>
                            <span className="value-number">{formatValue(payload[0].value)}</span>
                        </p>
                    </div>
                );
            }
            return null;
        };

        // Custom legend that limits the number of items shown
        const renderLegend = (props) => {
            const { payload } = props;
            const maxItems = isModal ? 10 : 5;

            // If we have too many items, show only a subset
            const displayItems = payload.length > maxItems
                ? [...payload.slice(0, maxItems - 1), { value: `+${payload.length - maxItems + 1} more` }]
                : payload;

            return (
                <ul className="custom-legend">
                    {displayItems.map((entry, index) => (
                        <li key={`item-${index}`} className="legend-item">
                            {index < maxItems - 1 || payload.length <= maxItems ? (
                                <>
                                    <span className="legend-color" style={{ backgroundColor: entry.color }} />
                                    <span className="legend-text">{entry.value}</span>
                                </>
                            ) : (
                                <span className="legend-more">{entry.value}</span>
                            )}
                        </li>
                    ))}
                </ul>
            );
        };

        // Render appropriate chart based on type
        switch (chartType) {
            case 'pie':
                return (
                    <div className="chart-container-wrapper">
                        <ResponsiveContainer width="100%" height={isModal ? 400 : 300}>
                            <PieChart>
                                <defs>
                                    {COLORS.map((color, index) => (
                                        <radialGradient key={`gradient-${index}`} id={`pieGradient${index}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                            <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                            <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                                        </radialGradient>
                                    ))}
                                </defs>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={isModal ? 140 : 100}
                                    innerRadius={isModal ? 70 : 50}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) =>
                                        percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                                    animationBegin={0}
                                    animationDuration={1200}
                                    animationEasing="ease-out"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`url(#pieGradient${index % COLORS.length})`}
                                            stroke={COLORS[index % COLORS.length]}
                                            strokeWidth={1}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    content={renderLegend}
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{ paddingTop: '20px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'line':
                return (
                    <div className="chart-container-wrapper">
                        <ResponsiveContainer width="100%" height={isModal ? 400 : 300}>
                            <LineChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={GRADIENT_COLORS.blue[0]} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={GRADIENT_COLORS.blue[1]} stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eaedf2" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#5a6282', fontSize: 12 }}
                                    axisLine={{ stroke: '#dbe0ea' }}
                                    tickLine={{ stroke: '#dbe0ea' }}
                                />
                                <YAxis
                                    tick={{ fill: '#5a6282', fontSize: 12 }}
                                    axisLine={{ stroke: '#dbe0ea' }}
                                    tickLine={{ stroke: '#dbe0ea' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend content={renderLegend} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={GRADIENT_COLORS.blue[0]}
                                    strokeWidth={3}
                                    activeDot={{ r: 8, fill: GRADIENT_COLORS.blue[0], stroke: '#fff', strokeWidth: 2 }}
                                    dot={{ r: 4, fill: GRADIENT_COLORS.blue[0], stroke: '#fff', strokeWidth: 2 }}
                                    animationBegin={0}
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'area':
                return (
                    <div className="chart-container-wrapper">
                        <ResponsiveContainer width="100%" height={isModal ? 400 : 300}>
                            <LineChart data={chartData}>
                                <defs>
                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={GRADIENT_COLORS.purple[0]} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={GRADIENT_COLORS.purple[1]} stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eaedf2" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#5a6282', fontSize: 12 }}
                                    axisLine={{ stroke: '#dbe0ea' }}
                                    tickLine={{ stroke: '#dbe0ea' }}
                                />
                                <YAxis
                                    tick={{ fill: '#5a6282', fontSize: 12 }}
                                    axisLine={{ stroke: '#dbe0ea' }}
                                    tickLine={{ stroke: '#dbe0ea' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend content={renderLegend} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={GRADIENT_COLORS.purple[0]}
                                    strokeWidth={3}
                                    fill="url(#areaGradient)"
                                    fillOpacity={1}
                                    activeDot={{ r: 8, fill: GRADIENT_COLORS.purple[0], stroke: '#fff', strokeWidth: 2 }}
                                    dot={{ r: 4, fill: GRADIENT_COLORS.purple[0], stroke: '#fff', strokeWidth: 2 }}
                                    animationBegin={0}
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'bar':
            default:
                return (
                    <div className="chart-container-wrapper">
                        <ResponsiveContainer width="100%" height={isModal ? 400 : 300}>
                            <BarChart data={chartData}>
                                <defs>
                                    {COLORS.map((color, index) => (
                                        <linearGradient key={`gradient-${index}`} id={`barGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                                            <stop offset="95%" stopColor={color} stopOpacity={0.6} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eaedf2" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#5a6282', fontSize: 12 }}
                                    axisLine={{ stroke: '#dbe0ea' }}
                                    tickLine={{ stroke: '#dbe0ea' }}
                                />
                                <YAxis
                                    tick={{ fill: '#5a6282', fontSize: 12 }}
                                    axisLine={{ stroke: '#dbe0ea' }}
                                    tickLine={{ stroke: '#dbe0ea' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend content={renderLegend} />
                                <Bar
                                    dataKey="value"
                                    radius={[4, 4, 0, 0]}
                                    animationBegin={0}
                                    animationDuration={1200}
                                    animationEasing="ease-out"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`url(#barGradient${index % COLORS.length})`}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
        }
    };

    const handleQueryClick = (index) => {
        setSelectedQueryIndex(index);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedQueryIndex(null);
    };

    return (
        <div className="space-y-6">
            {/* Query Input Section */}
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="userQuery" className="block text-sm font-medium text-gray-700 mb-1">
                            Enter your query
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                id="userQuery"
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                placeholder="What would you like to know about your data?"
                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900
                                         focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                         disabled:bg-gray-100 disabled:text-gray-500"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !userQuery.trim()}
                                variant="primary"
                            >
                                {isLoading ? 'Processing...' : 'Run Query'}
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Example Queries */}
                <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Example queries:</h3>
                    <div className="flex flex-wrap gap-2">
                        {exampleQueries.map((query, index) => (
                            <button
                                key={index}
                                onClick={() => handleExampleClick(query)}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700
                                         hover:bg-gray-200 transition-colors duration-150 ease-in-out"
                            >
                                {query}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Query Controls */}
            {displayedQueries.length > 0 && (
                <Card className="bg-white">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 min-w-0">
                            <input
                                type="text"
                                placeholder="Search queries..."
                                value={queryFilter}
                                onChange={(e) => setQueryFilter(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900
                                         focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                         placeholder-gray-500"
                            />
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900
                                         focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                         cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="records">Most Records</option>
                            </select>
                            <select
                                value={activeTab}
                                onChange={(e) => setActiveTab(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900
                                         focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                         cursor-pointer"
                            >
                                <option value="all">All Queries</option>
                                <option value="chartable">Charts Only</option>
                                <option value="tables">Tables Only</option>
                            </select>
                        </div>
                    </div>
                </Card>
            )}

            {/* Analysis Form */}
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

            {/* Query Results */}
            {displayedQueries.length > 0 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Query Results</h2>
                        {selectedQueries.length > 0 && (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-600">
                                    {selectedQueries.length} {selectedQueries.length === 1 ? 'query' : 'queries'} selected
                                </span>
                                <Button
                                    onClick={() => setShowAnalysisForm(true)}
                                    variant="primary"
                                    size="sm"
                                >
                                    Analyze Selected
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Query Results Grid */}
                    <div className="grid grid-cols-1 gap-6">
                        {isLoading && filteredAndSortedQueries.length === 0 ? (
                            <Card className="py-12 bg-white">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-gray-600 font-medium">Loading your queries...</p>
                                </div>
                            </Card>
                        ) : filteredAndSortedQueries.length === 0 ? (
                            <Card className="py-12 bg-white">
                                <div className="text-center">
                                    <p className="text-lg font-medium text-gray-800 mb-2">No queries to display</p>
                                    <p className="text-gray-600">
                                        {queryFilter ?
                                            'Try adjusting your search terms or filters.' :
                                            'Enter a new query or try one of the example queries above.'}
                                    </p>
                                </div>
                            </Card>
                        ) : (
                            filteredAndSortedQueries.map((query, index) => {
                                // Look for query text in multiple possible locations
                                const queryText =
                                    query.original_query ||
                                    (query.query && query.query.original_query) ||
                                    query.userQuery ||
                                    query.query ||
                                    query.text ||
                                    query.question ||
                                    (query.details && query.details.query);

                                // Format the query text for display
                                const formattedQueryText = queryText ?
                                    queryText.length > 80 ?
                                        queryText.substring(0, 77) + '...' :
                                        queryText :
                                    "No query text available";

                                // Get record count
                                const recordCount = query.filtered_data ? query.filtered_data.length : 0;

                                // Determine the table name to display (without user prefix)
                                const tableName = query.display_table_name ||
                                    (query.table_name ? formatColumnName(query.table_name) : null);

                                // Format timestamp if available
                                const timestamp = query.timestamp || query.created_at || null;
                                const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : null;

                                // Use the query ID to determine if this is the one pending deletion
                                const queryId = query.id || query.query_id;
                                const isPendingDelete = pendingDeleteIndex === index;

                                return (
                                    <Card
                                        key={index}
                                        className="overflow-hidden transition-all duration-200 hover:shadow-md bg-white"
                                    >
                                        <div className="border-b border-gray-100 bg-white">
                                            <div className="p-4">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <div className="pt-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedQueries.includes(queryId)}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    if (e.target.checked) {
                                                                        setSelectedQueries([...selectedQueries, queryId]);
                                                                    } else {
                                                                        setSelectedQueries(selectedQueries.filter(id => id !== queryId));
                                                                    }
                                                                }}
                                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded
                                                                         focus:ring-indigo-500 cursor-pointer focus:ring-offset-white"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3
                                                                title={queryText}
                                                                className="text-lg font-medium text-gray-900 truncate hover:text-indigo-600
                                                                         cursor-pointer transition-colors duration-150"
                                                                onClick={() => handleQueryClick(index)}
                                                            >
                                                                {formattedQueryText}
                                                            </h3>
                                                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                                                {recordCount > 0 && (
                                                                    <span className="inline-flex items-center text-sm font-medium text-indigo-600">
                                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                        </svg>
                                                                        {recordCount} {recordCount === 1 ? 'record' : 'records'}
                                                                    </span>
                                                                )}
                                                                {tableName && (
                                                                    <span className="inline-flex items-center text-sm text-gray-600">
                                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1.5 3 3 3h10c1.5 0 3-1 3-3V7c0-2-1.5-3-3-3H7C5.5 4 4 5 4 7z" />
                                                                        </svg>
                                                                        {tableName}
                                                                    </span>
                                                                )}
                                                                {formattedDate && (
                                                                    <span className="inline-flex items-center text-sm text-gray-500">
                                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        {formattedDate}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {isChartable(query.filtered_data) && (
                                                            <select
                                                                value={query.preferredChartType || (query.chart_data ? query.chart_data.type : 'bar')}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    handleChangeChartType(index, e.target.value);
                                                                }}
                                                                className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-sm
                                                                         focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                                                         cursor-pointer"
                                                            >
                                                                <option value="bar">Bar Chart</option>
                                                                <option value="pie">Pie Chart</option>
                                                                <option value="line">Line Chart</option>
                                                                <option value="area">Area Chart</option>
                                                            </select>
                                                        )}
                                                        <button
                                                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full
                                                                     hover:bg-gray-50 transition-colors duration-150"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPendingDeleteIndex(index);
                                                            }}
                                                            aria-label="Delete query"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {isPendingDelete && (
                                            <div
                                                className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center rounded-lg z-10"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 border border-gray-200">
                                                    <p className="text-gray-700 mb-4 text-center">Delete this query permanently?</p>
                                                    <div className="flex justify-center gap-4">
                                                        <Button
                                                            variant="error"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCloseQuery(index);
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPendingDeleteIndex(null);
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-4">
                                            {/* Chart section if data is chartable */}
                                            {isChartable(query.filtered_data) && (
                                                <div className="mb-6" onClick={(e) => e.stopPropagation()}>
                                                    {renderChart(
                                                        query.filtered_data,
                                                        query.preferredChartType || (query.chart_data ? query.chart_data.type : 'bar')
                                                    )}
                                                </div>
                                            )}

                                            {/* Data table section */}
                                            {query.filtered_data && query.filtered_data.length > 0 && (
                                                renderDataTable(query.filtered_data)
                                            )}
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Query Modal */}
            {modalOpen && selectedQuery && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closeModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 pr-8">{selectedQuery.original_query}</h2>
                            <button
                                className="text-gray-400 hover:text-gray-600"
                                onClick={closeModal}
                                aria-label="Close modal"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex flex-wrap gap-6 mb-6 text-sm">
                                {selectedQuery.filtered_data && (
                                    <div className="flex items-center">
                                        <span className="text-gray-600 mr-2">Records:</span>
                                        <span className="font-medium">{selectedQuery.filtered_data.length}</span>
                                    </div>
                                )}

                                {(selectedQuery.display_table_name || selectedQuery.table_name) && (
                                    <div className="flex items-center">
                                        <span className="text-gray-600 mr-2">Table:</span>
                                        <span className="font-medium">{selectedQuery.display_table_name || selectedQuery.table_name}</span>
                                    </div>
                                )}

                                {(selectedQuery.timestamp || selectedQuery.created_at) && (
                                    <div className="flex items-center">
                                        <span className="text-gray-600 mr-2">Date:</span>
                                        <span className="font-medium">{new Date(selectedQuery.timestamp || selectedQuery.created_at).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            {selectedQuery.sql_query && (
                                <div className="mb-6">
                                    <details open>
                                        <summary className="text-primary hover:underline cursor-pointer mb-2">SQL Query</summary>
                                        <pre className="p-4 bg-gray-800 text-white text-sm rounded-md overflow-x-auto">{selectedQuery.sql_query}</pre>
                                    </details>
                                </div>
                            )}

                            {isChartable(selectedQuery.filtered_data) && (
                                <div className="mb-6">
                                    <div className="h-80 mb-4">
                                        {renderChart(
                                            selectedQuery.filtered_data,
                                            selectedQuery.preferredChartType || (selectedQuery.chart_data ? selectedQuery.chart_data.type : 'bar'),
                                            true // isModal = true for larger chart
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                                        <span className="text-gray-600 font-medium">Chart Type:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {['bar', 'pie', 'line', 'area'].map(type => (
                                                <button
                                                    key={type}
                                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${(selectedQuery.preferredChartType || 'bar') === type
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => handleChangeChartType(selectedQueryIndex, type)}
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedQuery.filtered_data && selectedQuery.filtered_data.length > 0 && (
                                <div className="mb-6">
                                    {renderDataTable(selectedQuery.filtered_data)}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={closeModal}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        // Implement export functionality
                                        closeModal();
                                    }}
                                >
                                    Export Results
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QueryForm;