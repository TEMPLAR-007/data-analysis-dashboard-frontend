// API service for backend communication
const API_BASE_URL = 'http://localhost:3000/api';

export const api = {
    BASE_URL: API_BASE_URL,

    // Query endpoints
    async processQuery(queryData) {
        try {
            const response = await fetch(`${API_BASE_URL}/query/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(queryData),
            });
            return await response.json();
        } catch (error) {
            console.error('Error processing query:', error);
            throw error;
        }
    },

    async getAllSavedQueries() {
        try {
            const response = await fetch(`${API_BASE_URL}/query/saved`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching saved queries:', error);
            throw error;
        }
    },

    async deleteQuery(queryId) {
        try {
            const response = await fetch(`${API_BASE_URL}/query/saved/${queryId}`, {
                method: 'DELETE',
            });
            return await response.json();
        } catch (error) {
            console.error(`Error deleting query ${queryId}:`, error);
            throw error;
        }
    },

    async executeRawQuery(queryData) {
        try {
            const response = await fetch(`${API_BASE_URL}/query/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(queryData),
            });
            return await response.json();
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        }
    },

    async getTableSchema(tableName) {
        try {
            const response = await fetch(`${API_BASE_URL}/query/schema/${tableName}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching schema for ${tableName}:`, error);
            throw error;
        }
    },

    // Analysis endpoints
    async getQueryHistory(tableName) {
        try {
            const response = await fetch(`${API_BASE_URL}/analyze/history/${tableName}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching query history:', error);
            throw error;
        }
    },

    async getQueryResults(queryId) {
        try {
            const response = await fetch(`${API_BASE_URL}/analyze/query/${queryId}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching results for query ${queryId}:`, error);
            throw error;
        }
    },

    createAnalysis: async (data) => {
        if (!data.query_ids || !data.analysis_request) {
            console.error('Missing required fields for analysis creation');
            return {
                success: false,
                message: 'Missing required fields: query_ids or analysis_request'
            };
        }

        try {
            console.log('Creating analysis with data:', data);

            const response = await fetch(`${API_BASE_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            let result;
            try {
                result = await response.json();
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                return {
                    success: false,
                    message: 'Server returned invalid response format'
                };
            }

            console.log('Server response:', result);

            if (!response.ok) {
                console.error('Server error:', response.status, result);
                return {
                    success: false,
                    message: result.message || `Server error: ${response.status}`
                };
            }

            // Check for different possible ID fields in the response
            const analysisId = result.analysis_id || result.session_id || result.id;

            if (!analysisId) {
                console.error('Invalid server response - missing ID:', result);
                return {
                    success: false,
                    message: 'Server response missing ID field (tried: analysis_id, session_id, id)'
                };
            }

            return {
                success: true,
                analysis_id: analysisId,
                status: result.status || 'processing',
                message: result.message || 'Analysis created successfully'
            };
        } catch (error) {
            console.error('Error creating analysis:', error);
            return {
                success: false,
                message: error.message || 'Failed to create analysis'
            };
        }
    },

    getAnalysisResults: async (analysisId) => {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        try {
            console.log('Requesting analysis results for ID:', analysisId);

            // Try both endpoints since we might have a session_id
            let response;
            let responseBody = null;

            try {
                // Try the direct endpoint first
                console.log('Trying direct analysis endpoint');
                response = await fetch(`${API_BASE_URL}/analyze/${analysisId}`);
                responseBody = await response.json();

                if (!response.ok) {
                    console.log('Direct endpoint failed, trying session endpoint');
                    // If the first endpoint fails, try the session endpoint
                    response = await fetch(`${API_BASE_URL}/analyze/session/${analysisId}`);
                    responseBody = await response.json();
                }
            } catch (error) {
                console.log('Error with first endpoint, trying session endpoint', error);
                // If first endpoint throws, try the session endpoint
                response = await fetch(`${API_BASE_URL}/analyze/session/${analysisId}`);
                responseBody = await response.json();
            }

            if (!response.ok) {
                console.error('Server returned error:', response.status, responseBody);
                return {
                    success: false,
                    status: 'failed',
                    message: responseBody.message || `Server error: ${response.status}`
                };
            }

            console.log('Analysis results received:', responseBody);

            // Normalize the response format
            if (responseBody.results) {
                return {
                    success: true,
                    status: 'completed',
                    ...responseBody
                };
            }

            return responseBody;
        } catch (error) {
            console.error('Error getting analysis results:', error);
            return {
                success: false,
                status: 'failed',
                message: error.message || 'Network error when getting analysis results'
            };
        }
    },

    // Table Management endpoints
    async getAllTables() {
        try {
            const response = await fetch(`${API_BASE_URL}/tables`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching tables:', error);
            throw error;
        }
    },

    async getTableDetails(tableName) {
        try {
            const response = await fetch(`${API_BASE_URL}/tables/${tableName}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching table details for ${tableName}:`, error);
            throw error;
        }
    },

    async deleteTable(tableName) {
        try {
            const response = await fetch(`${API_BASE_URL}/tables/${tableName}`, {
                method: 'DELETE',
            });
            return await response.json();
        } catch (error) {
            console.error(`Error deleting table ${tableName}:`, error);
            throw error;
        }
    },

    // System endpoints
    async systemCleanup() {
        try {
            const response = await fetch(`${API_BASE_URL}/cleanup/all`, {
                method: 'POST',
            });
            return await response.json();
        } catch (error) {
            console.error('Error performing system cleanup:', error);
            throw error;
        }
    },

    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return await response.json();
        } catch (error) {
            console.error('Error checking API health:', error);
            throw error;
        }
    },

    async getSavedQueryDetails(queryId) {
        try {
            const response = await fetch(`${API_BASE_URL}/query/saved/${queryId}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching saved query details ${queryId}:`, error);
            throw error;
        }
    },

    // Analysis History endpoints
    async getAnalysisHistory(detailed = false) {
        try {
            const url = detailed
                ? `${API_BASE_URL}/analyze/history?detailed=true`
                : `${API_BASE_URL}/analyze/history`;

            const response = await fetch(url);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Server error: ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error('Error fetching analysis history:', error);
            throw error;
        }
    },
};

export default api;
