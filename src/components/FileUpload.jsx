import { useState } from 'react';
import api from '../utils/api';

const FileUpload = ({ onFileUploaded }) => {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

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

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await api.uploadFile(file);

            if (result.success) {
                setSuccess(`File successfully uploaded as table '${result.table || file.name.split('.')[0]}'`);
                setFile(null);

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
    );
};

export default FileUpload;