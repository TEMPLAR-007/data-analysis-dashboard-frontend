import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const AnalysisForm = ({ onClose }) => {
    const [analysisRequest, setAnalysisRequest] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState(null);
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        fetchAnalysisHistory();
    }, []);

    const fetchAnalysisHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const response = await api.getAnalysisHistory();
            if (response.success) {
                setAnalysisHistory(response.history);
            } else {
                console.error('Failed to fetch analysis history:', response.message);
            }
        } catch (error) {
            console.error('Error fetching analysis history:', error);
        }
        setIsLoadingHistory(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.createAnalysis({
                analysis_request: analysisRequest,
                query_ids: []  // Since this form doesn't have query selection
            });

            if (!response.success) {
                setError(response.message);
                setIsLoading(false);
                return;
            }

            const analysisId = response.analysis_id;
            await pollAnalysisResults(analysisId);
            // Refresh history after successful submission
            await fetchAnalysisHistory();
        } catch (error) {
            console.error('Analysis submission error:', error);
            setError(error.message || 'Failed to submit analysis request');
            setIsLoading(false);
        }
    };

    const pollAnalysisResults = async (analysisId) => {
        let attempts = 0;
        const maxAttempts = 30;

        while (attempts < maxAttempts) {
            try {
                const response = await api.getAnalysisResults(analysisId);

                if (!response.success) {
                    setError(response.message);
                    setIsLoading(false);
                    return;
                }

                if (response.status === 'completed') {
                    setResults(response.results);
                    setIsLoading(false);
                    onClose();
                    return;
                }

                if (response.status === 'failed') {
                    setError('Analysis failed. Please try again.');
                    setIsLoading(false);
                    return;
                }

                // If still processing, wait and try again
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            } catch (error) {
                console.error('Polling error:', error);
                setError(error.message || 'Failed to get analysis results');
                setIsLoading(false);
                return;
            }
        }

        setError('Analysis timed out. Please try again.');
        setIsLoading(false);
    };

    return (
        <div className="analysis-form-container">
            <div className="analysis-form">
                <h2>New Analysis</h2>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={analysisRequest}
                        onChange={(e) => setAnalysisRequest(e.target.value)}
                        placeholder="Enter your analysis request..."
                        required
                    />
                    {error && <div className="error-message">{error}</div>}
                    {results && <div className="success-message">Analysis completed successfully!</div>}
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Submit Analysis'}
                    </button>
                </form>
            </div>

            <div className="analysis-history">
                <h2>Analysis History</h2>
                {isLoadingHistory ? (
                    <div className="loading-message">Loading history...</div>
                ) : analysisHistory.length > 0 ? (
                    <ul className="history-list">
                        {analysisHistory.map((analysis) => (
                            <li key={analysis.id} className="history-item">
                                <div className="history-request">{analysis.request}</div>
                                <div className="history-status">
                                    Status: <span className={`status-${analysis.status}`}>{analysis.status}</span>
                                </div>
                                <div className="history-timestamp">
                                    {new Date(analysis.timestamp).toLocaleString()}
                                </div>
                                {analysis.results && (
                                    <div className="history-results">
                                        <strong>Results:</strong>
                                        <pre>{JSON.stringify(analysis.results, null, 2)}</pre>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="no-history">No analysis history available</div>
                )}
            </div>

            <style>{`
                .analysis-form-container {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 1rem;
                }

                .analysis-form, .analysis-history {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                h2 {
                    margin-top: 0;
                    color: #333;
                    margin-bottom: 1rem;
                }

                textarea {
                    width: 100%;
                    min-height: 100px;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                    resize: vertical;
                }

                .history-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .history-item {
                    border: 1px solid #eee;
                    border-radius: 4px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                }

                .history-request {
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                }

                .history-status {
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                }

                .history-timestamp {
                    font-size: 0.8rem;
                    color: #666;
                }

                .status-completed {
                    color: #2e7d32;
                }

                .status-failed {
                    color: #c62828;
                }

                .status-processing {
                    color: #1565c0;
                }

                .loading-message, .no-history {
                    text-align: center;
                    color: #666;
                    padding: 1rem;
                }

                .error-message {
                    color: #c62828;
                    background: #ffebee;
                    padding: 0.75rem;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                }

                .success-message {
                    color: #2e7d32;
                    background: #e8f5e9;
                    padding: 0.75rem;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                }

                button {
                    background: #1a73e8;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                }

                button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }

                .history-results {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: #f5f5f5;
                    border-radius: 4px;
                }

                .history-results pre {
                    margin: 0.5rem 0 0;
                    white-space: pre-wrap;
                    font-size: 0.9rem;
                }
            `}</style>
        </div>
    );
};

export default AnalysisForm;
