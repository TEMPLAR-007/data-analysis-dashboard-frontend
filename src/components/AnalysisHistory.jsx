import { useState, useEffect } from 'react';
import api from '../utils/api';

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
                    const response = await fetch(`${api.BASE_URL}/analyze/history/${analysisId}`);
                    const detailedResult = await response.json();

                    console.log('Detailed result:', detailedResult);

                    if (detailedResult && detailedResult.success) {
                        // Extract the results based on the response format
                        let resultsData;

                        if (detailedResult.dashboard) {
                            // If response has dashboard structure
                            resultsData = {
                                ...detailedResult.dashboard.insights,
                                visualization: detailedResult.dashboard.visualization,
                                metadata: detailedResult.dashboard.metadata
                            };
                        } else if (detailedResult.analysis && detailedResult.analysis.results) {
                            // If response has analysis.results structure
                            resultsData = detailedResult.analysis.results;
                        } else if (detailedResult.results) {
                            // If response has a direct results property
                            resultsData = detailedResult.results;
                        } else {
                            // Fallback if no recognizable structure
                            resultsData = { error: 'Unrecognized result format' };
                        }

                        console.log('Processed results data:', resultsData);

                        // Update the history item with the results
                        setHistory(prevHistory => prevHistory.map(item =>
                            item.id === analysisId ? {
                                ...item,
                                results: resultsData
                            } : item
                        ));
                    } else {
                        throw new Error(detailedResult.message || 'Failed to fetch analysis details');
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
            const response = await fetch(`${api.BASE_URL}/analyze/${analysisId}`, {
                method: 'DELETE',
            });

            const result = await response.json();
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
            items = data;
        } else if (typeof data === 'object') {
            items = Object.values(data);
        } else if (typeof data === 'string') {
            items = [data];
        } else {
            return null;
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
                            {typeof item === 'object'
                                ? (item.description || item.title || JSON.stringify(item))
                                : String(item)}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // Revise the placeholder chart rendering to match the screenshot style
    const renderPlaceholderChart = (type, title, dataPoints) => {
        const isMetric = type.toLowerCase() === 'metrics' || type.toLowerCase() === 'metric';

        return (
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                height: 'auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                border: '1px solid #e1e9ff',
                color: '#5f6368',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                margin: '0.5rem 0'
            }}>
                <div style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#1a73e8',
                    marginBottom: '0.75rem',
                    width: '100%'
                }}>
                    {title || type}
                </div>

                {isMetric ? (
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#202124',
                        marginTop: '1rem'
                    }}>
                        {dataPoints !== null && dataPoints !== undefined ? dataPoints : 'N/A'}
                    </div>
                ) : (
                    <div style={{
                        width: '100%',
                        textAlign: 'center',
                        marginTop: '0.5rem'
                    }}>
                        <div style={{
                            fontStyle: 'italic',
                            marginBottom: '0.5rem'
                        }}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>
                            {dataPoints !== null && dataPoints !== undefined ? `${dataPoints} data points` : ''}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Enhanced visualization grid with Chart.js inspired implementation
    const renderSimpleVisualizationGrid = (results) => {
        if (!results) return null;

        // Extract visualization data from the results
        let visualizations = [];

        // Handle dashboard format
        if (results.visualization?.components) {
            // Add metrics
            if (results.visualization.components.metrics) {
                visualizations.push({
                    id: 'metrics',
                    type: 'metrics',
                    title: 'Metrics',
                    data: results.visualization.components.metrics,
                    width: results.visualization.components.metrics.width || 6,
                    height: results.visualization.components.metrics.height || 2
                });
            }

            // Add bar chart
            if (results.visualization.components.barChart) {
                visualizations.push({
                    id: 'barChart',
                    type: 'bar',
                    title: results.visualization.components.barChart.title || 'Bar Chart',
                    data: results.visualization.components.barChart.data,
                    width: results.visualization.components.barChart.width || 6,
                    height: results.visualization.components.barChart.height || 4
                });
            }
        }

        // Create default visualizations if none are present
        if (visualizations.length === 0) {
            visualizations = [
                { id: 'metrics', type: 'metrics', title: 'Metrics', value: 'N/A', width: 6, height: 2 },
                { id: 'bar1', type: 'bar', title: 'Revenue Comparison of Electric Products', dataPoints: 5, width: 6, height: 4 }
            ];
        }

        // Render the metrics card with detailed styling
        const renderMetricItem = (item) => {
            // Determine trend direction
            const trendColor = item.trend === 'up' ? '#0f9d58' : (item.trend === 'down' ? '#d93025' : '#5f6368');
            const trendIcon = item.trend === 'up' ? '↑' : (item.trend === 'down' ? '↓' : '–');

            return (
                <div key={item.title} style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#e8f0fe',
                        borderRadius: '50%',
                        color: '#1967d2',
                        fontSize: '1.2rem'
                    }}>
                        {item.icon === 'attach_money' ? '$' : '📊'}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '0.85rem',
                            color: '#64748b',
                            marginBottom: '0.5rem'
                        }}>
                            {item.title}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <div style={{
                                fontSize: '1.75rem',
                                fontWeight: 'bold',
                                color: '#202124'
                            }}>
                                {item.value}
                            </div>

                            {item.trend && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: trendColor,
                                    fontSize: '0.9rem',
                                    fontWeight: '500'
                                }}>
                                    {trendIcon}
                                </div>
                            )}
                        </div>

                        {item.comparison && (
                            <div style={{
                                fontSize: '0.85rem',
                                color: '#5f6368',
                                marginTop: '0.5rem'
                            }}>
                                <span style={{ fontWeight: '500' }}>{item.comparison.label}:</span> {item.comparison.value}
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        // Render chart with enhanced styling
        const renderChart = (chart) => {
            if (!chart || !chart.data) {
                return renderPlaceholderChart('bar', chart?.title || 'Chart', 5);
            }

            // Create HTML bar chart visualization
            const labels = chart.data.labels || [];
            const values = chart.data.values || [];
            const colors = chart.data.colors || ['#4CAF50', '#2196F3', '#FFC107', '#FF8042', '#9C27B0', '#82ca9d'];
            const maxValue = Math.max(...values);

            const formatValue = (val) => {
                if (val >= 1000000) {
                    return `${(val / 1000000).toFixed(1)}M`;
                } else if (val >= 1000) {
                    return `${(val / 1000).toFixed(1)}K`;
                }
                return new Intl.NumberFormat().format(val);
            };

            return (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    border: '1px solid #e1e9ff'
                }}>
                    <div style={{
                        color: '#334155',
                        fontSize: '1rem',
                        fontWeight: '500',
                        marginBottom: '1rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '1px solid #f1f5f9'
                    }}>
                        {chart.title}
                    </div>

                    <div style={{ height: '300px', position: 'relative', marginTop: '1rem' }}>
                        {/* Chart area */}
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
                                                {formatValue(value)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Y-axis */}
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
                            <div>0</div>
                        </div>

                        {/* X-axis */}
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
                    </div>

                    {chart.data.context?.description && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            marginTop: '1rem',
                            textAlign: 'center',
                            fontStyle: 'italic'
                        }}>
                            {chart.data.context.description}
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                    color: '#202124',
                    marginBottom: '1rem',
                    borderBottom: '1px solid #e1e9ff',
                    paddingBottom: '0.5rem',
                    fontSize: '1.2rem',
                    fontWeight: 'normal'
                }}>Visualization</h3>

                {/* Dashboard Grid Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: '1rem'
                }}>
                    {visualizations.map(viz => {
                        if (viz.type === 'metrics' && results.visualization?.components?.metrics?.items) {
                            // Render metrics section
                            return (
                                <div key={viz.id} style={{
                                    gridColumn: `span ${viz.width}`,
                                    gridRow: `span ${viz.height}`
                                }}>
                                    <div style={{
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '8px',
                                        padding: '1rem'
                                    }}>
                                        {results.visualization.components.metrics.items.map(item =>
                                            renderMetricItem(item)
                                        )}
                                    </div>
                                </div>
                            );
                        } else if (viz.type === 'bar' && results.visualization?.components?.barChart) {
                            // Render bar chart
                            return (
                                <div key={viz.id} style={{
                                    gridColumn: `span ${viz.width}`,
                                    gridRow: `span ${viz.height}`
                                }}>
                                    {renderChart({
                                        title: viz.title,
                                        data: results.visualization.components.barChart.data
                                    })}
                                </div>
                            );
                        } else {
                            // Render placeholder
                            return (
                                <div key={viz.id} style={{
                                    gridColumn: `span ${viz.width}`,
                                    gridRow: `span ${viz.height}`
                                }}>
                                    {renderPlaceholderChart(viz.type, viz.title, viz.dataPoints)}
                                </div>
                            );
                        }
                    })}
                </div>
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