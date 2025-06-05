// API service for backend communication
import { auth } from './auth';

const API_BASE_URL = 'https://api.gaszip.app/api';

export const api = {
    BASE_URL: API_BASE_URL,

    // Authentication endpoints
    async login(identifier, password) {
        try {
            // Determine if identifier is email or username
            const isEmail = identifier.includes('@');

            // Create login payload based on identifier type
            const loginData = {
                password
            };

            if (isEmail) {
                loginData.email = identifier;
            } else {
                loginData.username = identifier;
            }

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || `Login failed: ${response.status}`
                };
            }

            // Store token
            if (result.token) {
                auth.setToken(result.token);
            }

            return {
                success: true,
                user: result.user,
                message: result.message || 'Login successful'
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Failed to login'
            };
        }
    },

    async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || `Registration failed: ${response.status}`
                };
            }

            return {
                success: true,
                user: result.user,
                message: result.message || 'Registration successful'
            };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: error.message || 'Failed to register'
            };
        }
    },

    async logout() {
        auth.logout();
        return { success: true, message: 'Logged out successfully' };
    },

    // Add private method to get headers with auth
    _getHeaders(contentType = 'application/json') {
        const headers = {
            'Content-Type': contentType,
            ...auth.getAuthHeader(),
        };

        return headers;
    },

    // File Upload endpoints
    async uploadFile(file, tableName) {
        if (!file) {
            console.error('Missing required file for upload');
            return {
                success: false,
                message: 'Missing required file'
            };
        }

        try {
            console.log(`Uploading file ${file.name}`);

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/upload/file`, {
                method: 'POST',
                headers: auth.getAuthHeader(),
                body: formData,
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

            if (!response.ok) {
                console.error('Server error:', response.status, result);
                return {
                    success: false,
                    message: result.message || `Server error: ${response.status}`
                };
            }

            return {
                success: true,
                table: result.table || tableName,
                message: result.message || 'File uploaded successfully',
                ...result
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            return {
                success: false,
                message: error.message || 'Failed to upload file'
            };
        }
    },

    // Query endpoints
    async processQuery(queryData) {
        try {
            const response = await fetch(`${API_BASE_URL}/query/process`, {
                method: 'POST',
                headers: this._getHeaders(),
                body: JSON.stringify(queryData),
            });

            const result = await response.json();
            console.log('Process query result:', result);

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || `Query processing failed: ${response.status}`
                };
            }

            return result;
        } catch (error) {
            console.error('Error processing query:', error);
            return {
                success: false,
                message: error.message || 'Failed to process query'
            };
        }
    },

    async getAllSavedQueries() {
        try {
            const response = await fetch(`${API_BASE_URL}/query/saved`, {
                headers: auth.getAuthHeader()
            });

            const result = await response.json();
            console.log('Saved queries result:', result);

            if (!response.ok) {
                return {
                    success: false,
                    queries: [],
                    message: result.message || `Failed to fetch queries: ${response.status}`
                };
            }

            return result;
        } catch (error) {
            console.error('Error fetching saved queries:', error);
            return {
                success: false,
                queries: [],
                message: error.message || 'Failed to fetch saved queries'
            };
        }
    },

    async deleteQuery(queryId) {
        try {
            const response = await fetch(`${API_BASE_URL}/query/saved/${queryId}`, {
                method: 'DELETE',
                headers: auth.getAuthHeader()
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
                headers: this._getHeaders(),
                body: JSON.stringify(queryData),
            });
            return await response.json();
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        }
    },

    // Table Management endpoints
    async getTables() {
        try {
            const response = await fetch(`${API_BASE_URL}/upload/tables`, {
                headers: auth.getAuthHeader()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching tables:', error);
            return {
                success: false,
                message: 'Failed to get tables',
                error: error.message
            };
        }
    },

    async deleteTable(tableName) {
        try {
            const response = await fetch(`${API_BASE_URL}/upload/table/${tableName}`, {
                method: 'DELETE',
                headers: auth.getAuthHeader()
            });
            return await response.json();
        } catch (error) {
            console.error(`Error deleting table ${tableName}:`, error);
            return {
                success: false,
                message: `Failed to delete table: ${tableName}`,
                error: error.message
            };
        }
    },

    async getTableSchema(tableName) {
        try {
            const response = await fetch(`${API_BASE_URL}/query/schema/${tableName}`, {
                headers: auth.getAuthHeader()
            });
            return await response.json();
        } catch (error) {
            console.error(`Error fetching schema for table ${tableName}:`, error);
            return {
                success: false,
                message: `Failed to get schema for table: ${tableName}`,
                error: error.message
            };
        }
    },

    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`, {
                headers: auth.getAuthHeader()
            });
            return await response.json();
        } catch (error) {
            console.error('Error checking API health:', error);
            return {
                status: 'error',
                message: 'Unable to connect to API service'
            };
        }
    },

    async getSavedQueryDetails(queryId) {
        try {
            const response = await fetch(`${API_BASE_URL}/query/saved/${queryId}`, {
                headers: auth.getAuthHeader()
            });

            const result = await response.json();
            console.log(`Query details result for ${queryId}:`, result);

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || `Failed to fetch query details: ${response.status}`
                };
            }

            return result;
        } catch (error) {
            console.error(`Error fetching saved query details ${queryId}:`, error);
            return {
                success: false,
                message: error.message || 'Failed to fetch query details'
            };
        }
    },

    // Analysis endpoints
    async createAnalysis(analysisData) {
        try {
            const response = await fetch(`${API_BASE_URL}/analysis`, {
                method: 'POST',
                headers: this._getHeaders(),
                body: JSON.stringify(analysisData),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || `Analysis creation failed: ${response.status}`
                };
            }

            return {
                success: true,
                analysis_id: result.analysis_id,
                message: result.message || 'Analysis created successfully'
            };
        } catch (error) {
            console.error('Analysis creation error:', error);
            return {
                success: false,
                message: error.message || 'Failed to create analysis'
            };
        }
    },

    async getAnalysisResults(analysisId) {
        try {
            const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}/results`, {
                headers: this._getHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    status: 'failed',
                    message: result.message || `Failed to get analysis results: ${response.status}`
                };
            }

            return {
                ...result,
                success: true
            };
        } catch (error) {
            console.error('Error getting analysis results:', error);
            return {
                success: false,
                status: 'failed',
                message: error.message || 'Failed to get analysis results'
            };
        }
    },

    async getAnalysisHistory() {
        try {
            const response = await fetch(`${API_BASE_URL}/analyze/history`, {
                headers: this._getHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    history: [],
                    message: result.message || `Failed to fetch analysis history: ${response.status}`
                };
            }

            return {
                success: true,
                history: result.history || [],
                message: result.message || 'Analysis history fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching analysis history:', error);
            return {
                success: false,
                history: [],
                message: error.message || 'Failed to fetch analysis history'
            };
        }
    },

    async getAnalysisDetails(analysisId) {
        try {
            const response = await fetch(`${API_BASE_URL}/analyze/history/${analysisId}`, {
                headers: this._getHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || `Failed to fetch analysis details: ${response.status}`
                };
            }

            // Process the results based on the response format
            let resultsData;
            if (result.dashboard) {
                resultsData = {
                    ...result.dashboard.insights,
                    visualization: result.dashboard.visualization,
                    metadata: result.dashboard.metadata
                };
            } else if (result.analysis && result.analysis.results) {
                resultsData = result.analysis.results;
            } else if (result.results) {
                resultsData = result.results;
            } else {
                resultsData = result;
            }

            return {
                success: true,
                results: resultsData,
                message: result.message || 'Analysis details fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching analysis details:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch analysis details'
            };
        }
    },

    async deleteAnalysis(analysisId) {
        try {
            const response = await fetch(`${API_BASE_URL}/analyze/${analysisId}`, {
                method: 'DELETE',
                headers: this._getHeaders()
            });

            // Handle non-JSON responses (like 204 No Content)
            if (response.status === 204) {
                return {
                    success: true,
                    message: 'Analysis deleted successfully'
                };
            }

            let result;
            try {
                result = await response.json();
            } catch {
                // If response is not JSON and not 204, it's an error
                if (!response.ok) {
                    throw new Error(`Failed to delete analysis: ${response.status}`);
                }
                // If response is OK but not JSON, assume success
                return {
                    success: true,
                    message: 'Analysis deleted successfully'
                };
            }

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || `Failed to delete analysis: ${response.status}`
                };
            }

            return {
                success: true,
                message: result.message || 'Analysis deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting analysis:', error);
            return {
                success: false,
                message: error.message || 'Failed to delete analysis'
            };
        }
    }
};

// Add default export for backward compatibility
export default api;