import React, { useState, useEffect } from 'react';
import AnalysisHistory from './AnalysisHistory';
import { api } from '../utils/api';

const AnalysisTab = ({ currentAnalysis, onClose }) => {
    const [showHistory, setShowHistory] = useState(!currentAnalysis);
    const [analysisInProgress, setAnalysisInProgress] = useState(false);
    const [analysisId, setAnalysisId] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);
    const [analysisResults, setAnalysisResults] = useState(null);

    // Set a timeout to prevent indefinite analysis
    useEffect(() => {
        let timeoutId;

        if (analysisInProgress && analysisId) {
            const pollAnalysisResults = async () => {
                try {
                    console.log('Polling analysis results for ID:', analysisId);
                    const results = await api.getAnalysisResults(analysisId);
                    console.log('Poll response:', results);

                    // Handle different response formats
                    if (results.status === 'completed' ||
                        (results.success === true && results.results)) {
                        console.log('Analysis completed successfully');
                        setAnalysisResults(results);
                        setAnalysisInProgress(false);
                    } else if (results.status === 'failed' || results.success === false) {
                        console.log('Analysis failed');
                        setAnalysisError('Analysis failed: ' + (results.message || 'Unknown error'));
                        setAnalysisInProgress(false);
                    } else if (!results || Object.keys(results).length === 0) {
                        console.log('Empty results returned');
                        setAnalysisError('Server returned empty results. Please try again.');
                        setAnalysisInProgress(false);
                    }
                } catch (error) {
                    console.error('Error polling analysis:', error);
                    setAnalysisError('Error checking analysis status: ' + error.message);
                    setAnalysisInProgress(false);
                }
            };

            // Initial poll immediately
            pollAnalysisResults();

            // Then poll every 3 seconds
            const intervalId = setInterval(pollAnalysisResults, 3000);

            // Set a timeout to cancel polling after 30 seconds (reduced from 60)
            timeoutId = setTimeout(() => {
                console.log('Analysis timeout reached');
                clearInterval(intervalId);
                setAnalysisInProgress(false);
                setAnalysisError('Analysis timed out after 30 seconds. Please try again.');
            }, 30000);

            return () => {
                clearInterval(intervalId);
                clearTimeout(timeoutId);
            };
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [analysisInProgress, analysisId]);

    // Handle starting a new analysis
    const handleStartAnalysis = async (request, queryIds) => {
        if (!request || !queryIds || queryIds.length === 0) {
            setAnalysisError('Cannot start analysis: Missing request or query selection');
            return;
        }

        console.log('Starting analysis with request:', request);
        console.log('Selected queries:', queryIds);

        setAnalysisInProgress(true);
        setAnalysisError(null);
        setAnalysisResults(null);

        try {
            const response = await api.createAnalysis({
                query_ids: queryIds,
                analysis_request: request
            });

            console.log('Create analysis response:', response);

            if (response.success && response.analysis_id) {
                console.log('Setting analysis ID:', response.analysis_id);
                setAnalysisId(response.analysis_id);
            } else {
                throw new Error(response.message || 'Failed to start analysis: No analysis ID returned');
            }
        } catch (error) {
            console.error('Analysis creation error:', error);
            setAnalysisError('Failed to start analysis: ' + error.message);
            setAnalysisInProgress(false);
        }
    };

    const renderAnalysisResults = () => {
        if (!currentAnalysis && !analysisResults) return null;

        console.log('Rendering analysis results:', currentAnalysis || analysisResults);

        // Handle different possible formats of the results data
        let resultsData;

        if (currentAnalysis) {
            resultsData = currentAnalysis.results || currentAnalysis;
        } else {
            resultsData = analysisResults.results || analysisResults;
        }

        // If resultsData is still null or undefined, show a message
        if (!resultsData) {
            return (
                <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    margin: '1rem',
                    textAlign: 'center',
                    color: '#5f6368'
                }}>
                    <h3 style={{ color: '#1a73e8', margin: '0 0 1rem 0' }}>Analysis Complete</h3>
                    <p>The analysis has completed but no results data was returned.</p>
                </div>
            );
        }

        // Extract the insights, trends and recommendations with fallbacks
        const insights = resultsData.insights || [];
        const trends = resultsData.trends || [];
        const recommendations = resultsData.recommendations || [];

        const hasNoResults = insights.length === 0 && trends.length === 0 && recommendations.length === 0;

        return (
            <div style={{
                padding: '1.5rem',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                margin: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{ color: '#1a73e8', margin: 0 }}>Analysis Results</h3>
                    <button
                        onClick={() => {
                            setAnalysisResults(null);
                            setAnalysisId(null);
                            setAnalysisError(null);
                            if (onClose) onClose();
                        }}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Close Analysis
                    </button>
                </div>

                {hasNoResults && (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#5f6368'
                    }}>
                        <p>No analysis results were generated. Try a different query or analysis request.</p>
                    </div>
                )}

                {/* Insights */}
                {insights.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: '#202124' }}>Key Insights</h4>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {insights.map((insight, index) => (
                                <div key={index} style={{
                                    padding: '1rem',
                                    backgroundColor: '#f8faff',
                                    borderRadius: '6px',
                                    border: '1px solid #e1e9ff'
                                }}>
                                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#1a73e8' }}>{insight.title}</h5>
                                    <p style={{ margin: '0', color: '#3c4043' }}>{insight.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Trends */}
                {trends.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: '#202124' }}>Trends</h4>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {trends.map((trend, index) => (
                                <div key={index} style={{
                                    padding: '1rem',
                                    backgroundColor: '#f8faff',
                                    borderRadius: '6px',
                                    border: '1px solid #e1e9ff'
                                }}>
                                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#1a73e8' }}>{trend.title}</h5>
                                    <p style={{ margin: '0', color: '#3c4043' }}>{trend.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: '#202124' }}>Recommendations</h4>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {recommendations.map((rec, index) => (
                                <div key={index} style={{
                                    padding: '1rem',
                                    backgroundColor: '#f8faff',
                                    borderRadius: '6px',
                                    border: '1px solid #e1e9ff'
                                }}>
                                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#1a73e8' }}>{rec.title}</h5>
                                    <p style={{ margin: '0', color: '#3c4043' }}>{rec.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                <h2 style={{ margin: 0, color: '#202124' }}>Analysis Dashboard</h2>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                    }}
                >
                    {showHistory ? 'Hide History' : 'Show History'}
                </button>
            </div>

            {analysisInProgress && (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#f8faff',
                    borderRadius: '8px',
                    margin: '1rem 0'
                }}>
                    <div style={{
                        border: '4px solid #e1e9ff',
                        borderTopColor: '#1a73e8',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }} />
                    <p style={{ color: '#1a73e8', fontWeight: 500 }}>Analysis in progress...</p>
                    <p style={{ color: '#5f6368', fontSize: '0.9rem' }}>
                        This may take up to a minute. Please wait.
                    </p>
                    <button
                        onClick={() => setAnalysisInProgress(false)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            marginTop: '1rem'
                        }}
                    >
                        Cancel Analysis
                    </button>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}

            {analysisError && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#fce8e6',
                    color: '#c5221f',
                    borderRadius: '8px',
                    margin: '1rem 0'
                }}>
                    <p style={{ margin: 0 }}>{analysisError}</p>
                </div>
            )}

            {(currentAnalysis || analysisResults) && renderAnalysisResults()}

            {showHistory && !analysisInProgress && (
                <div style={{ marginTop: '2rem' }}>
                    <AnalysisHistory onStartAnalysis={handleStartAnalysis} />
                </div>
            )}
        </div>
    );
};

export default AnalysisTab;