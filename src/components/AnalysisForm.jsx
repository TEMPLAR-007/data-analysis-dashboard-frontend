import { useState } from 'react';
import api from '../utils/api';

const AnalysisForm = ({ queryIds, onClose, onAnalysisComplete }) => {
    const [analysisRequest, setAnalysisRequest] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            console.log('Submitting analysis for queries:', queryIds); // Debug log

            // Create analysis session
            const response = await api.createAnalysis({
                query_ids: queryIds,
                analysis_request: analysisRequest
            });

            console.log('Analysis creation response:', response); // Debug log

            if (!response.success) {
                throw new Error(response.message || 'Failed to create analysis');
            }

            if (!response.analysis_id) {
                throw new Error('Server response missing analysis ID. Please try again or contact support.');
            }

            // Poll for results
            const results = await pollAnalysisResults(response.analysis_id);
            onAnalysisComplete(results);
            onClose();
        } catch (err) {
            console.error('Analysis error:', err);
            setError(
                `Analysis failed: ${err.message}. ` +
                (err.message.includes('analysis ID') ?
                    'This might be a temporary server issue. Please try again.' :
                    'Please check your query selection and try again.')
            );
        } finally {
            setIsLoading(false);
        }
    };

    const pollAnalysisResults = async (analysisId) => {
        const maxAttempts = 30; // Maximum number of polling attempts
        const pollInterval = 2000; // Poll every 2 seconds

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await api.getAnalysisResults(analysisId);

                if (response.status === 'completed') {
                    return response;
                } else if (response.status === 'failed') {
                    throw new Error(response.message || 'Analysis failed');
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } catch (err) {
                console.error('Polling error:', err);
                throw new Error('Error polling analysis results: ' + err.message);
            }
        }

        throw new Error('Analysis timed out after ' + maxAttempts + ' attempts');
    };

    return (
        <div className="analysis-form-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div className="analysis-form-modal" style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '2rem',
                width: '90%',
                maxWidth: '600px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
                <h2 style={{ marginTop: 0, color: '#1a73e8' }}>Analyze Selected Queries</h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="analysis-request" style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 500
                        }}>
                            What would you like to analyze?
                        </label>
                        <textarea
                            id="analysis-request"
                            value={analysisRequest}
                            onChange={(e) => setAnalysisRequest(e.target.value)}
                            placeholder="E.g., Analyze sales trends for specific product categories"
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '0.75rem',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                resize: 'vertical'
                            }}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            padding: '0.75rem',
                            borderRadius: '4px',
                            marginBottom: '1rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1rem',
                        marginTop: '1.5rem'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !analysisRequest.trim()}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: '#1a73e8',
                                color: 'white',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'Analyzing...' : 'Start Analysis'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AnalysisForm;
