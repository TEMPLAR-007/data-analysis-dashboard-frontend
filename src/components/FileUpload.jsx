import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { auth } from '../utils/auth';

const FileUpload = ({ onFileUploaded }) => {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingTables, setIsLoadingTables] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [tables, setTables] = useState([]);
    const [tableSchemas, setTableSchemas] = useState({});
    const [isDeleting, setIsDeleting] = useState(false);
    const [tableToDelete, setTableToDelete] = useState(null);

    // Fetch tables when component mounts
    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setIsLoadingTables(true);
        setError(null);
        try {
            // Check if user is authenticated
            if (!auth.isAuthenticated()) {
                setError('Authentication required. Please log in to view your data tables.');
                setTables([]);
                return;
            }

            const result = await api.getTables();
            console.log('Fetched tables result:', result);

            if (result.tables) {
                // Filter out system tables
                const systemTables = ['migrations', 'saved_queries', 'analysis_history', 'analysis_sessions', 'uploaded_files'];

                // Handle both array of strings and array of objects formats
                let processedTables = result.tables;

                // Check if the tables are objects with tableName property
                if (result.tables.length > 0 && typeof result.tables[0] === 'object') {
                    processedTables = result.tables.map(table => table.tableName || table.name || table.table_name || '');
                }

                setTables(processedTables.filter(name => !systemTables.includes(name)));
            } else {
                setError(result.message || 'Failed to fetch tables');
                setTables([]);
            }
        } catch (err) {
            console.error('Error fetching tables:', err);
            setError('Failed to load tables. Please check your connection and try again.');
            setTables([]);
        } finally {
            setIsLoadingTables(false);
        }
    };

    const getTableSchema = async (tableName) => {
        // Ensure tableName is a string
        const tableNameStr = typeof tableName === 'object'
            ? (tableName.tableName || tableName.name || tableName.table_name || JSON.stringify(tableName))
            : String(tableName);

        if (tableSchemas[tableNameStr]) return;

        try {
            // Update UI to show loading for this table
            setTableSchemas(prev => ({
                ...prev,
                [tableNameStr]: 'loading'
            }));

            const result = await api.getTableSchema(tableNameStr);
            console.log(`Schema result for ${tableNameStr}:`, result);

            if (result.columns) {
                setTableSchemas(prev => ({
                    ...prev,
                    [tableNameStr]: result.columns
                }));
            } else {
                setTableSchemas(prev => ({
                    ...prev,
                    [tableNameStr]: { error: result.message || 'Failed to load schema' }
                }));
            }
        } catch (err) {
            console.error(`Error fetching schema for ${tableNameStr}:`, err);
            setTableSchemas(prev => ({
                ...prev,
                [tableNameStr]: { error: err.message || 'Error loading schema' }
            }));
        }
    };

    const handleDeleteTable = async (tableName) => {
        // Ensure tableName is a string
        const tableNameStr = typeof tableName === 'object'
            ? (tableName.tableName || tableName.name || tableName.table_name || JSON.stringify(tableName))
            : String(tableName);

        setTableToDelete(tableNameStr);
    };

    const confirmDeleteTable = async () => {
        if (!tableToDelete) return;

        setIsDeleting(true);
        try {
            const result = await api.deleteTable(tableToDelete);
            if (result.success) {
                setSuccess(`Table '${tableToDelete}' has been deleted`);
                // Remove table from list
                setTables(prev => prev.filter(name => {
                    // Handle object or string
                    const nameStr = typeof name === 'object'
                        ? (name.tableName || name.name || name.table_name || '')
                        : String(name);
                    return nameStr !== tableToDelete;
                }));
                // Remove schema
                setTableSchemas(prev => {
                    const newState = { ...prev };
                    delete newState[tableToDelete];
                    return newState;
                });
            } else {
                setError(`Failed to delete table: ${result.message}`);
            }
        } catch (err) {
            setError(`Error deleting table: ${err.message}`);
        } finally {
            setIsDeleting(false);
            setTableToDelete(null);
        }
    };

    const cancelDeleteTable = () => {
        setTableToDelete(null);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        // Check if user is authenticated
        if (!auth.isAuthenticated()) {
            setError('Authentication required. Please log in to upload files.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await api.uploadFile(file);
            console.log('Upload result:', result);

            if (result.success) {
                setSuccess(`File successfully uploaded as table '${result.table || file.name.split('.')[0]}'`);
                setFile(null);

                // Refresh the table list after successful upload
                fetchTables();

                if (onFileUploaded) {
                    onFileUploaded(result);
                }
            } else {
                setError(result.message || 'Error uploading file');
            }
        } catch (err) {
            console.error('File upload error:', err);
            setError(err.message || 'Failed to upload file');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="main-dashboard">
            <div className="dashboard-top" style={{ width: '100%', maxWidth: '100%', padding: '1rem' }}>
                {/* Authentication Troubleshooting Alert */}
                {!auth.isAuthenticated() && (
                    <div style={{
                        backgroundColor: '#fff3e0',
                        border: '1px solid #ffcc80',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem'
                    }}>
                        <div style={{ fontSize: '1.5rem', color: '#f57c00' }}>
                            ⚠️
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#e65100' }}>
                                Authentication Required
                            </h4>
                            <p style={{ margin: '0 0 0.5rem 0' }}>
                                You need to be logged in to view and upload data files.
                            </p>
                            <a href="/login" style={{
                                backgroundColor: '#fb8c00',
                                color: 'white',
                                textDecoration: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                display: 'inline-block',
                                fontWeight: '500'
                            }}>
                                Go to Login
                            </a>
                        </div>
                    </div>
                )}

                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    marginBottom: '1.5rem'
                }}>
                    <h3 style={{
                        color: '#1a73e8',
                        marginTop: 0,
                        marginBottom: '1rem',
                        fontSize: '1.2rem'
                    }}>
                        Upload Data File
                    </h3>

                    {error && (
                        <div style={{
                            backgroundColor: '#fdeded',
                            color: '#5f2120',
                            padding: '0.75rem',
                            borderRadius: '4px',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            backgroundColor: '#edf7ed',
                            color: '#1e4620',
                            padding: '0.75rem',
                            borderRadius: '4px',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div
                            style={{
                                marginBottom: '1.5rem',
                                border: `2px dashed ${isDragging ? '#1a73e8' : '#dadce0'}`,
                                borderRadius: '8px',
                                padding: '2rem',
                                textAlign: 'center',
                                backgroundColor: isDragging ? '#f8faff' : '#f8f9fa',
                                transition: 'all 0.2s ease'
                            }}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                                    📄
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    color: '#5f6368',
                                    marginBottom: '1rem'
                                }}>
                                    {file ? `Selected: ${file.name}` : 'Drag & drop a file here or click to browse'}
                                </div>

                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileChange}
                                    style={{
                                        display: 'none'
                                    }}
                                />
                                <label
                                    htmlFor="file-upload"
                                    style={{
                                        backgroundColor: '#e8f0fe',
                                        color: '#1967d2',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'inline-block'
                                    }}
                                >
                                    Browse Files
                                </label>
                            </div>

                            <div style={{
                                marginTop: '0.25rem',
                                fontSize: '0.8rem',
                                color: '#5f6368'
                            }}>
                                Supported formats: CSV, Excel (.xlsx, .xls)
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !file}
                            style={{
                                backgroundColor: file ? '#1a73e8' : '#dadce0',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.75rem 1.5rem',
                                fontSize: '1rem',
                                cursor: file && !isLoading ? 'pointer' : 'not-allowed',
                                opacity: isLoading ? 0.7 : 1,
                                width: '100%'
                            }}
                        >
                            {isLoading ? 'Uploading...' : 'Upload File'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="dashboard-content" style={{ padding: '0 1rem' }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    marginBottom: '1.5rem'
                }}>
                    <h3 style={{
                        color: '#1a73e8',
                        marginTop: 0,
                        marginBottom: '1rem',
                        fontSize: '1.2rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>Available Data Tables</span>
                        <button
                            onClick={fetchTables}
                            style={{
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #dadce0',
                                borderRadius: '4px',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.8rem',
                                color: '#5f6368',
                                cursor: 'pointer'
                            }}
                        >
                            {isLoadingTables ? 'Loading...' : 'Refresh'}
                        </button>
                    </h3>

                    {tableToDelete && (
                        <div style={{
                            backgroundColor: '#fef8f8',
                            padding: '0.75rem',
                            borderRadius: '4px',
                            marginBottom: '1rem',
                            border: '1px solid #ffcdd2',
                        }}>
                            <p style={{
                                margin: '0 0 0.75rem 0',
                                color: '#d32f2f',
                                fontWeight: '500'
                            }}>
                                Are you sure you want to delete table "{tableToDelete}"?
                            </p>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.5rem'
                            }}>
                                <button
                                    onClick={cancelDeleteTable}
                                    disabled={isDeleting}
                                    style={{
                                        backgroundColor: '#f5f5f5',
                                        color: '#333',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        padding: '0.4rem 0.75rem',
                                        fontSize: '0.85rem',
                                        cursor: isDeleting ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteTable}
                                    disabled={isDeleting}
                                    style={{
                                        backgroundColor: '#d32f2f',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0.4rem 0.75rem',
                                        fontSize: '0.85rem',
                                        cursor: isDeleting ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Table'}
                                </button>
                            </div>
                        </div>
                    )}

                    {isLoadingTables ? (
                        <div style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: '#5f6368',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px'
                        }}>
                            <div style={{
                                border: '3px solid #e1e9ff',
                                borderTopColor: '#1a73e8',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 1rem'
                            }} />
                            <p style={{ margin: 0 }}>Loading your data tables...</p>
                            <style>{`
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    ) : tables.length === 0 ? (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            textAlign: 'center',
                            color: '#5f6368'
                        }}>
                            No data tables available. Upload a file to create a table.
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gap: '0.75rem'
                        }}>
                            {tables.map(tableName => {
                                // If tableName is an object (which shouldn't happen after our fix, but just to be safe)
                                const tableNameStr = typeof tableName === 'object'
                                    ? (tableName.tableName || tableName.name || tableName.table_name || JSON.stringify(tableName))
                                    : String(tableName);

                                return (
                                    <div key={tableNameStr} style={{
                                        border: '1px solid #e1e9ff',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            backgroundColor: '#f8faff',
                                            borderBottom: '1px solid #e1e9ff',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                <span style={{
                                                    fontSize: '1.4rem',
                                                    color: '#1a73e8'
                                                }}>📊</span>
                                                <span style={{
                                                    fontWeight: '500',
                                                    color: '#202124'
                                                }}>{tableNameStr}</span>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => getTableSchema(tableNameStr)}
                                                    style={{
                                                        backgroundColor: '#e8f0fe',
                                                        color: '#1967d2',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        padding: '0.4rem 0.75rem',
                                                        marginRight: '0.5rem',
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    View Schema
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTable(tableNameStr)}
                                                    style={{
                                                        backgroundColor: '#fdeded',
                                                        color: '#d93025',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        padding: '0.4rem 0.75rem',
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        {tableSchemas[tableNameStr] && (
                                            <div style={{
                                                padding: '0.75rem 1rem',
                                                maxHeight: '300px',
                                                overflowY: 'auto'
                                            }}>
                                                <h4 style={{
                                                    margin: '0 0 0.75rem 0',
                                                    fontSize: '0.9rem',
                                                    color: '#5f6368'
                                                }}>Table Schema</h4>

                                                {tableSchemas[tableNameStr] === 'loading' ? (
                                                    <div style={{
                                                        textAlign: 'center',
                                                        padding: '1rem',
                                                        color: '#5f6368'
                                                    }}>
                                                        <div style={{
                                                            border: '2px solid #e1e9ff',
                                                            borderTopColor: '#1a73e8',
                                                            borderRadius: '50%',
                                                            width: '20px',
                                                            height: '20px',
                                                            animation: 'spin 1s linear infinite',
                                                            margin: '0 auto 0.5rem'
                                                        }} />
                                                        <p style={{ margin: 0 }}>Loading schema...</p>
                                                    </div>
                                                ) : tableSchemas[tableNameStr].error ? (
                                                    <div style={{
                                                        padding: '0.75rem',
                                                        backgroundColor: '#fce8e6',
                                                        color: '#c5221f',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {tableSchemas[tableNameStr].error}
                                                    </div>
                                                ) : (
                                                    <table style={{
                                                        width: '100%',
                                                        borderCollapse: 'collapse',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{
                                                                    textAlign: 'left',
                                                                    padding: '0.5rem',
                                                                    borderBottom: '1px solid #e1e9ff',
                                                                    backgroundColor: '#f8faff'
                                                                }}>Column</th>
                                                                <th style={{
                                                                    textAlign: 'left',
                                                                    padding: '0.5rem',
                                                                    borderBottom: '1px solid #e1e9ff',
                                                                    backgroundColor: '#f8faff'
                                                                }}>Type</th>
                                                                <th style={{
                                                                    textAlign: 'left',
                                                                    padding: '0.5rem',
                                                                    borderBottom: '1px solid #e1e9ff',
                                                                    backgroundColor: '#f8faff'
                                                                }}>Nullable</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tableSchemas[tableNameStr].map((column, idx) => (
                                                                <tr key={idx}>
                                                                    <td style={{
                                                                        padding: '0.5rem',
                                                                        borderBottom: '1px solid #f0f0f0'
                                                                    }}>{column.column_name}</td>
                                                                    <td style={{
                                                                        padding: '0.5rem',
                                                                        borderBottom: '1px solid #f0f0f0',
                                                                        color: getDataTypeColor(column.data_type)
                                                                    }}>{column.data_type}</td>
                                                                    <td style={{
                                                                        padding: '0.5rem',
                                                                        borderBottom: '1px solid #f0f0f0'
                                                                    }}>{column.is_nullable}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper function to color code data types
const getDataTypeColor = (dataType) => {
    switch (dataType.toLowerCase()) {
        case 'numeric':
        case 'integer':
        case 'float':
        case 'double':
            return '#1a73e8';
        case 'text':
        case 'varchar':
        case 'char':
            return '#0f9d58';
        case 'date':
        case 'timestamp':
        case 'datetime':
            return '#9c27b0';
        case 'boolean':
            return '#f57c00';
        default:
            return '#202124';
    }
};

export default FileUpload;