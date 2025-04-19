import React from 'react';

const DataTable = ({ data }) => {
    if (!data || data.length === 0) {
        return null;
    }

    // Extract column headers from the first data object
    const columns = Object.keys(data[0]);

    return (
        <div className="data-table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column}>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((column) => (
                                <td key={`${rowIndex}-${column}`}>
                                    {row[column] !== null && row[column] !== undefined
                                        ? String(row[column])
                                        : '-'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
