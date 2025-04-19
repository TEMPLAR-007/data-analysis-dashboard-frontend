import { useState } from 'react';
import api from '../utils/api';

const FileUpload = ({ onFileUploaded }) => {
    const [file, setFile] = useState(null);
    const [tableName, setTableName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Generate a table name suggestion based on the file name
            const fileNameWithoutExtension = selectedFile.name.split('.')[0];
            setTableName(fileNameWithoutExtension.toLowerCase().replace(/\s+/g, '_'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        if (!tableName) {
            setError('Please provide a table name');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await api.uploadFile(file, tableName);

            if (result.success) {
                setSuccess(`File successfully uploaded as table '${tableName}'`);
                setFile(null);
                setTableName('');

                if (onFileUploaded) {
                    onFileUploaded(result);
                }
            } else {
                setError(result.message || 'Error uploading file');
            }
        } catch (err) {
            setError(err.message || 'Failed to upload file');
        } finally {
            setIsLoading(false);
        }
    };

    return (
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
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="file-upload"
                        style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#202124',
                            fontSize: '0.9rem'
                        }}
                    >
                        Select File (CSV or Excel)
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #dadce0',
                            borderRadius: '4px',
                            backgroundColor: '#f8faff'
                        }}
                    />
                    <div style={{
                        marginTop: '0.25rem',
                        fontSize: '0.8rem',
                        color: '#5f6368'
                    }}>
                        Supported formats: CSV, Excel (.xlsx, .xls)
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label
                        htmlFor="table-name"
                        style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#202124',
                            fontSize: '0.9rem'
                        }}
                    >
                        Table Name
                    </label>
                    <input
                        id="table-name"
                        type="text"
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        placeholder="Enter table name (e.g., sales_data)"
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #dadce0',
                            borderRadius: '4px',
                            fontSize: '1rem'
                        }}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        backgroundColor: '#1a73e8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        cursor: isLoading ? 'wait' : 'pointer',
                        opacity: isLoading ? 0.7 : 1
                    }}
                >
                    {isLoading ? 'Uploading...' : 'Upload File'}
                </button>
            </form>
        </div>
    );
};

export default FileUpload;