import React from 'react';
import Chart from 'chart.js/auto';
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const AnalysisHistory = ({ onStartAnalysis }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});
    const [analysisRequest, setAnalysisRequest] = useState('');
    const [selectedQueries, setSelectedQueries] = useState([]);
    const [showAnalysisForm, setShowAnalysisForm] = useState(false);
    const [savedQueries, setSavedQueries] = useState([]);
    const [loadingQueries, setLoadingQueries] = useState(false);
    const [isDeletingAnalysis, setIsDeletingAnalysis] = useState(null);

    const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await api.getAnalysisHistory(false);
            if (result.success && result.history) {
                setHistory(result.history);
            } else {
                setHistory([]);
                throw new Error('Failed to fetch analysis history');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSavedQueries = async () => {
        setLoadingQueries(true);
        try {
            const result = await api.getAllSavedQueries();
            if (result.success && result.queries) {
                setSavedQueries(result.queries);
            } else {
                setSavedQueries([]);
            }
        } catch (err) {
            console.error('Error fetching saved queries:', err);
        } finally {
            setLoadingQueries(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (showAnalysisForm) {
            fetchSavedQueries();
        }
    }, [showAnalysisForm]);

    const handleAnalysisSubmit = (e) => {
        e.preventDefault();
        if (analysisRequest.trim() && selectedQueries.length > 0) {
            onStartAnalysis(analysisRequest, selectedQueries);
            setShowAnalysisForm(false);
            setAnalysisRequest('');
            setSelectedQueries([]);
        }
    };

    const handleNewAnalysis = () => {
        setShowAnalysisForm(true);
    };

    const toggleDetailView = async (analysisId) => {
        // Create a copy of the current expanded items
        const updatedExpanded = { ...expandedItems };

        // Toggle the expanded state for this item immediately for better UX
        updatedExpanded[analysisId] = !updatedExpanded[analysisId];
        setExpandedItems(updatedExpanded);

        // If we're expanding and don't have results yet, fetch them
        if (updatedExpanded[analysisId]) {
            const currentAnalysis = history.find(item => item.id === analysisId);
            if (currentAnalysis && !currentAnalysis.results) {
                try {
                    console.log(`Fetching details for analysis ${analysisId}`);
                    const response = await api.getAnalysisDetails(analysisId);
                    console.log('Detailed result:', response);

                    if (response.success) {
                        // Update the history item with the results
                        setHistory(prevHistory => prevHistory.map(item =>
                            item.id === analysisId ? {
                                ...item,
                                results: response.results
                            } : item
                        ));
                    } else {
                        throw new Error(response.message || 'Failed to fetch analysis details');
                    }
                } catch (err) {
                    console.error(`Error fetching details for analysis ${analysisId}:`, err);
                    setHistory(prevHistory => prevHistory.map(item =>
                        item.id === analysisId ? {
                            ...item,
                            results: { error: `Failed to load details: ${err.message}` }
                        } : item
                    ));
                }
            }
        }
    };

    const handleDeleteAnalysis = async (analysisId) => {
        if (!analysisId || isDeletingAnalysis === analysisId) return;

        setIsDeletingAnalysis(analysisId);

        try {
            console.log(`Deleting analysis with ID: ${analysisId}`);
            const result = await api.deleteAnalysis(analysisId);
            console.log('Delete result:', result);

            if (result.success) {
                // Remove the deleted analysis from the history
                setHistory(prevHistory => prevHistory.filter(item => item.id !== analysisId));

                // Also remove from expanded items if it was expanded
                if (expandedItems[analysisId]) {
                    const updatedExpanded = { ...expandedItems };
                    delete updatedExpanded[analysisId];
                    setExpandedItems(updatedExpanded);
                }
            } else {
                throw new Error(result.message || 'Failed to delete analysis');
            }
        } catch (err) {
            console.error(`Error deleting analysis ${analysisId}:`, err);
            setError(`Failed to delete analysis: ${err.message}`);
        } finally {
            setIsDeletingAnalysis(null);
        }
    };

    // Helper function to render any data section
    const renderDataSection = (data, title) => {
        if (!data) return null;

        let items = [];
        if (Array.isArray(data)) {
            items = data.map(item => {
                if (typeof item === 'object' && item !== null) {
                    // Handle objects by extracting relevant text
                    return item.description || item.title || item.text ||
                        (item.source && item.description ? `${item.source}: ${item.description}` :
                            JSON.stringify(item));
                }
                return String(item);
            });
        } else if (typeof data === 'object' && data !== null) {
            items = Object.values(data).map(item => {
                if (typeof item === 'object' && item !== null) {
                    // Handle nested objects
                    return item.description || item.title || item.text ||
                        (item.source && item.description ? `${item.source}: ${item.description}` :
                            JSON.stringify(item));
                }
                return String(item);
            });
        } else if (typeof data === 'string') {
            items = [data];
        } else {
            items = [String(data)];
        }

        if (items.length === 0) return null;

        return (
            <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#202124', marginBottom: '0.5rem' }}>{title}</h4>
                <ul style={{
                    margin: '0',
                    paddingLeft: '1.5rem',
                    color: '#3c4043'
                }}>
                    {items.map((item, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem' }}>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const renderMetricItem = (item) => {
        if (!item || !item.value) return null;

        const trendColor = item.trend > 0 ? '#10b981' : item.trend < 0 ? '#ef4444' : '#6b7280';
        const trendIcon = item.trend > 0 ? '↑' : item.trend < 0 ? '↓' : '→';

        return (
            <div key={item.label} style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '0.25rem'
                }}>
                    {item.label}
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.5rem'
                }}>
                    <span style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#111827'
                    }}>
                        {typeof item.value === 'number' ?
                            new Intl.NumberFormat('en-US', {
                                style: item.format === 'currency' ? 'currency' : 'decimal',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                            }).format(item.value)
                            : item.value}
                    </span>
                    {item.trend !== undefined && (
                        <span style={{
                            fontSize: '0.875rem',
                            color: trendColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            {trendIcon}
                            {Math.abs(item.trend)}%
                        </span>
                    )}
                </div>
                {item.context && (
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '0.25rem'
                    }}>
                        {item.context}
                    </div>
                )}
            </div>
        );
    };

    const ChartComponent = ({ title, data, context }) => {
        const chartRef = React.useRef(null);
        const chartInstance = React.useRef(null);
        const dataRef = React.useRef(null);

        // Memoize the chart configuration to prevent unnecessary re-renders
        const chartConfig = React.useMemo(() => ({
            type: 'bar',
            data: {
                labels: data?.labels?.map(label => String(label)) || [],
                datasets: [{
                    data: data?.values?.map(value => Number(value) || 0) || [],
                    backgroundColor: '#1a73e8',
                    borderColor: '#1557b0',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                let value = context.raw;
                                return new Intl.NumberFormat('en-US', {
                                    style: data?.format === 'currency' ? 'currency' : 'decimal',
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                }).format(value);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return new Intl.NumberFormat('en-US', {
                                    style: data?.format === 'currency' ? 'currency' : 'decimal',
                                    currency: 'USD',
                                    notation: 'compact',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 1
                                }).format(value);
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        }), [data?.labels, data?.values, data?.format]); // Only recreate config when these values change

        React.useEffect(() => {
            if (!chartRef.current || !data || !data.labels || !data.values) return;

            // Check if data has actually changed
            if (dataRef.current &&
                JSON.stringify(dataRef.current) === JSON.stringify(data)) {
                return;
            }

            // Update data reference
            dataRef.current = data;

            // Cleanup previous chart instance
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }

            // Create new chart instance
            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, chartConfig);

            // Cleanup on unmount
            return () => {
                if (chartInstance.current) {
                    chartInstance.current.destroy();
                    chartInstance.current = null;
                }
            };
        }, [chartConfig]); // Only depend on memoized config

        if (!data || !data.labels || !data.values) return null;

        return (
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '1rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {typeof title === 'string' && title && (
                    <div style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#111827',
                        marginBottom: '1rem'
                    }}>
                        {title}
                    </div>
                )}
                <div style={{
                    flex: 1,
                    minHeight: 0,
                    position: 'relative'
                }}>
                    <canvas ref={chartRef} />
                </div>
                {typeof context === 'string' && context && (
                    <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginTop: '1rem',
                        textAlign: 'center'
                    }}>
                        {context}
                    </div>
                )}
            </div>
        );
    };

    // Enhanced visualization grid with Chart.js inspired implementation
    const renderSimpleVisualizationGrid = (results) => {
        if (!results) return null;

        // Get visualization data from the results
        const visualization = results.visualization;
        if (!visualization || !visualization.components) {
            return null;
        }

        const { components, layout = [] } = visualization;

        return (
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                    color: '#202124',
                    marginBottom: '1.5rem',
                    borderBottom: '1px solid #e1e9ff',
                    paddingBottom: '0.75rem',
                    fontSize: '1.2rem',
                    fontWeight: '500'
                }}>
                    Analysis Visualization
                </h3>

                {/* Dashboard Grid Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    {layout.map((section) => {
                        const componentData = components[section.name];
                        if (!componentData) return null;

                        // Ensure data is properly formatted for charts
                        let formattedData = null;
                        if (componentData.type === 'bar' && componentData.data) {
                            formattedData = {
                                labels: Array.isArray(componentData.data.labels) ? componentData.data.labels : [],
                                values: Array.isArray(componentData.data.values) ? componentData.data.values : [],
                                format: componentData.data.format || 'decimal'
                            };
                        }

                        return (
                            <div key={section.name} style={{
                                gridColumn: `span ${section.width || 12}`,
                                gridRow: `span ${section.height || 1}`,
                                minHeight: section.height === 1 ? '120px' : '300px'
                            }}>
                                {componentData.type === 'metrics' && componentData.items ? (
                                    <div style={{
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        height: '100%'
                                    }}>
                                        {componentData.items.map((item) => renderMetricItem(item))}
                                    </div>
                                ) : componentData.type === 'bar' && formattedData ? (
                                    <ChartComponent
                                        title={componentData.title}
                                        data={formattedData}
                                        context={componentData.context}
                                    />
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                {/* Insights and Analysis */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1.5rem',
                    marginTop: '2rem'
                }}>
                    {results.insights && Object.entries(results.insights).map(([key, data]) => {
                        if (!data || (Array.isArray(data) && data.length === 0)) return null;

                        const titleMap = {
                            'insights': 'Key Insights',
                            'trends': 'Trends',
                            'findings': 'Findings',
                            'recommendations': 'Recommendations'
                        };

                        return (
                            <div key={key} style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                border: '1px solid #e1e9ff'
                            }}>
                                <h4 style={{
                                    color: '#1a73e8',
                                    marginTop: 0,
                                    marginBottom: '1rem',
                                    fontSize: '1.1rem',
                                    fontWeight: '500'
                                }}>
                                    {titleMap[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                                </h4>
                                <ul style={{
                                    margin: 0,
                                    padding: 0,
                                    listStyle: 'none'
                                }}>
                                    {Array.isArray(data) ? data.map((item, index) => (
                                        <li key={index} style={{
                                            marginBottom: '0.75rem',
                                            paddingLeft: '1.5rem',
                                            position: 'relative',
                                            color: '#374151',
                                            fontSize: '0.9375rem',
                                            lineHeight: '1.5'
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                color: '#1a73e8',
                                                fontWeight: '500'
                                            }}>•</span>
                                            {item}
                                        </li>
                                    )) : (
                                        <li style={{ color: '#374151' }}>{data}</li>
                                    )}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* Metadata Section */}
                {results.metadata && (
                    <div style={{
                        marginTop: '2rem',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        border: '1px solid #e1e9ff'
                    }}>
                        <details>
                            <summary style={{
                                cursor: 'pointer',
                                color: '#1a73e8',
                                fontWeight: '500',
                                marginBottom: '1rem'
                            }}>
                                Analysis Details
                            </summary>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                gap: '1rem',
                                fontSize: '0.875rem',
                                color: '#374151'
                            }}>
                                {results.metadata.processing_time && (
                                    <div>Processing Time: {results.metadata.processing_time}</div>
                                )}
                                {results.metadata.analysis_type && (
                                    <div>Analysis Type: {results.metadata.analysis_type}</div>
                                )}
                                {results.metadata.record_count && (
                                    <div>Records Analyzed: {results.metadata.record_count}</div>
                                )}
                                {results.metadata.analyzing_query && (
                                    <div>Query: {results.metadata.analyzing_query}</div>
                                )}
                                {results.metadata.timestamp && (
                                    <div>Timestamp: {new Date(results.metadata.timestamp).toLocaleString()}</div>
                                )}
                            </div>
                        </details>
                    </div>
                )}
            </div>
        );
    };

    const renderAnalysisCard = (analysis) => {
        const formattedDate = new Date(analysis.created_at).toLocaleString();
        const isExpanded = expandedItems[analysis.id] || false;

        return (
            <div key={analysis.id} style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                padding: '1rem',
                marginBottom: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                }}>
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a73e8' }}>
                            Analysis Request
                        </h3>
                        <p style={{ margin: '0', color: '#3c4043' }}>
                            {analysis.analysis_request}
                        </p>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#5f6368', fontSize: '0.875rem' }}>
                            Type: {analysis.analysis_type} | Queries: {analysis.query_count}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            backgroundColor: analysis.status === 'completed' ? '#e6f4ea' : '#fce8e6',
                            color: analysis.status === 'completed' ? '#137333' : '#c5221f'
                        }}>
                            {analysis.status}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => toggleDetailView(analysis.id)}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    backgroundColor: isExpanded ? '#e8f0fe' : '#fff',
                                    border: '1px solid #1a73e8',
                                    borderRadius: '4px',
                                    color: '#1a73e8',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {isExpanded ? 'Hide Details' : 'View Details'}
                            </button>
                            <button
                                onClick={() => handleDeleteAnalysis(analysis.id)}
                                disabled={isDeletingAnalysis === analysis.id}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    backgroundColor: '#fff',
                                    border: '1px solid #d93025',
                                    borderRadius: '4px',
                                    color: '#d93025',
                                    cursor: isDeletingAnalysis === analysis.id ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    opacity: isDeletingAnalysis === analysis.id ? 0.7 : 1
                                }}
                            >
                                {isDeletingAnalysis === analysis.id ? (
                                    <>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '12px',
                                            height: '12px',
                                            border: '2px solid #d93025',
                                            borderTopColor: 'transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                        Deleting...
                                    </>
                                ) : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <>
                        {(() => {
                            // Get the current analysis with possibly updated results
                            const currentAnalysis = history.find(item => item.id === analysis.id) || analysis;

                            // Check if we have results or are still loading
                            if (currentAnalysis.results) {
                                return (
                                    <div style={{
                                        backgroundColor: '#f8faff',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        marginBottom: '1rem'
                                    }}>
                                        {/* Error message if fetch failed */}
                                        {currentAnalysis.results.error && (
                                            <div style={{
                                                padding: '1rem',
                                                backgroundColor: '#fce8e6',
                                                color: '#c5221f',
                                                borderRadius: '8px',
                                                marginBottom: '1rem'
                                            }}>
                                                <p style={{ margin: 0 }}>{currentAnalysis.results.error}</p>
                                            </div>
                                        )}

                                        {/* Always render visualizations, even without visualization property */}
                                        {renderSimpleVisualizationGrid(currentAnalysis.results)}

                                        {/* Render all data sections dynamically */}
                                        {currentAnalysis.results && Object.keys(currentAnalysis.results).filter(
                                            key => !['visualization', 'metrics', 'metadata', 'error'].includes(key)
                                        ).map(key => {
                                            const titleMap = {
                                                'insights': 'Key Insights',
                                                'trends': 'Trends',
                                                'findings': 'Findings',
                                                'recommendations': 'Recommendations',
                                                'summary': 'Summary',
                                                'anomalies': 'Anomalies',
                                                'correlations': 'Correlations'
                                            };

                                            const title = titleMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
                                            return renderDataSection(currentAnalysis.results[key], title);
                                        })}

                                        {/* Show no results message if no data sections are available */}
                                        {currentAnalysis.results && Object.keys(currentAnalysis.results).filter(
                                            key => !['visualization', 'metrics', 'metadata', 'error'].includes(key) &&
                                                currentAnalysis.results[key] &&
                                                (Array.isArray(currentAnalysis.results[key]) ? currentAnalysis.results[key].length > 0 : true)
                                        ).length === 0 && !currentAnalysis.results.error && !currentAnalysis.results.visualization && !currentAnalysis.results.metrics && (
                                                <div style={{ padding: '1rem', textAlign: 'center', color: '#5f6368' }}>
                                                    <p>No detailed results available for this analysis.</p>
                                                </div>
                                            )}

                                        {/* Metadata */}
                                        {currentAnalysis.results.metadata && (
                                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e1e9ff', paddingTop: '1rem' }}>
                                                <details>
                                                    <summary style={{
                                                        cursor: 'pointer',
                                                        color: '#5f6368',
                                                        fontWeight: 500,
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        Analysis Metadata
                                                    </summary>
                                                    <div style={{
                                                        fontSize: '0.875rem',
                                                        color: '#5f6368',
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                                        gap: '0.5rem'
                                                    }}>
                                                        {currentAnalysis.results.metadata.processing_time && (
                                                            <div>Processing time: {currentAnalysis.results.metadata.processing_time}</div>
                                                        )}
                                                        {currentAnalysis.results.metadata.timestamp && (
                                                            <div>Timestamp: {new Date(currentAnalysis.results.metadata.timestamp).toLocaleString()}</div>
                                                        )}
                                                        {currentAnalysis.results.metadata.analysis_type && (
                                                            <div>Analysis type: {currentAnalysis.results.metadata.analysis_type}</div>
                                                        )}
                                                        {currentAnalysis.results.metadata.data_sources && (
                                                            <div>Data sources: {currentAnalysis.results.metadata.data_sources.length} queries</div>
                                                        )}
                                                    </div>
                                                </details>
                                            </div>
                                        )}
                                    </div>
                                );
                            } else {
                                // Still loading
                                return (
                                    <div style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        color: '#5f6368',
                                        backgroundColor: '#f8faff',
                                        borderRadius: '4px',
                                        margin: '0.5rem 0 1rem'
                                    }}>
                                        <div style={{
                                            border: '3px solid #e1e9ff',
                                            borderTopColor: '#1a73e8',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            animation: 'spin 1s linear infinite',
                                            margin: '0 auto 0.5rem'
                                        }} />
                                        <p style={{ margin: '0' }}>Loading analysis details...</p>
                                        <style>{`
                                            @keyframes spin {
                                                0% { transform: rotate(0deg); }
                                                100% { transform: rotate(360deg); }
                                            }
                                        `}</style>
                                    </div>
                                );
                            }
                        })()}
                    </>
                )}

                <div style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e1e9ff',
                    fontSize: '0.875rem',
                    color: '#5f6368'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Created: {formattedDate}</span>
                        {analysis.updated_at && analysis.updated_at !== analysis.created_at && (
                            <span>Updated: {new Date(analysis.updated_at).toLocaleString()}</span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h2 style={{ margin: 0, color: '#202124' }}>Analysis History</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleNewAnalysis}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#1a73e8',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        New Analysis
                    </button>
                </div>
            </div>

            {showAnalysisForm && (
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    padding: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#1a73e8' }}>Create New Analysis</h3>
                    <form onSubmit={handleAnalysisSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label
                                htmlFor="analysisRequest"
                                style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: 500,
                                    color: '#202124'
                                }}
                            >
                                What would you like to analyze?
                            </label>
                            <textarea
                                id="analysisRequest"
                                value={analysisRequest}
                                onChange={(e) => setAnalysisRequest(e.target.value)}
                                placeholder="E.g., Analyze sales trends for specific product categories"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    minHeight: '100px',
                                    resize: 'vertical',
                                    boxSizing: 'border-box'
                                }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 500,
                                color: '#202124'
                            }}>
                                Select queries to analyze:
                            </label>
                            {loadingQueries ? (
                                <p style={{ color: '#5f6368' }}>Loading saved queries...</p>
                            ) : savedQueries.length > 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    padding: '0.5rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}>
                                    {savedQueries.map(query => (
                                        <label key={query.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0.5rem',
                                            backgroundColor: selectedQueries.includes(query.id) ? '#e8f0fe' : '#f8f9fa',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            width: 'calc(50% - 0.5rem)'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedQueries.includes(query.id)}
                                                onChange={() => {
                                                    if (selectedQueries.includes(query.id)) {
                                                        setSelectedQueries(selectedQueries.filter(id => id !== query.id));
                                                    } else {
                                                        setSelectedQueries([...selectedQueries, query.id]);
                                                    }
                                                }}
                                                style={{ marginRight: '0.5rem' }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 500, color: '#202124' }}>
                                                    {query.name || 'Unnamed Query'}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#5f6368' }}>
                                                    {query.description || query.original_query?.substring(0, 50) || 'No description'}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#5f6368' }}>No saved queries available for analysis</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setShowAnalysisForm(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!analysisRequest.trim() || selectedQueries.length === 0}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#1a73e8',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    opacity: (!analysisRequest.trim() || selectedQueries.length === 0) ? 0.6 : 1
                                }}
                            >
                                Start Analysis
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {error && (
                <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fce8e6',
                    color: '#c5221f',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            {isLoading ? (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#5f6368'
                }}>
                    Loading analysis history...
                </div>
            ) : (
                <div>
                    {history.length > 0 ? (
                        history.map(analysis => renderAnalysisCard(analysis))
                    ) : (
                        <div style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: '#5f6368',
                            backgroundColor: '#f8faff',
                            borderRadius: '8px'
                        }}>
                            No analysis history found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalysisHistory;