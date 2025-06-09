import React, { useState, useEffect } from 'react';

/**
 * DataTable component built with Tailwind CSS
 *
 * @param {Object} props
 * @param {Array} props.data - Array of objects representing table data
 * @param {string} props.title - Optional table title
 * @param {boolean} props.compact - Whether to use compact styling
 * @param {function} props.onRowClick - Optional callback when a row is clicked
 * @returns {JSX.Element}
 */
const DataTable = ({
    data = [],
    title = '',
    compact = false,
    onRowClick = null
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [columnFilters, setColumnFilters] = useState({});
    const [hoveredRow, setHoveredRow] = useState(null);

    // Get column headers from the first data item
    const columns = data && data.length > 0
        ? Object.keys(data[0])
        : [];

    // Apply filters and sorting
    const filteredData = React.useMemo(() => {
        if (!data || data.length === 0) return [];

        let filtered = [...data];

        // Apply search term across all columns
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(row =>
                Object.values(row).some(value =>
                    String(value).toLowerCase().includes(lowerSearchTerm)
                )
            );
        }

        // Apply column filters
        Object.entries(columnFilters).forEach(([column, filterValue]) => {
            if (filterValue) {
                const lowerFilterValue = filterValue.toLowerCase();
                filtered = filtered.filter(row =>
                    String(row[column]).toLowerCase().includes(lowerFilterValue)
                );
            }
        });

        // Apply sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // Handle numeric values
                if (!isNaN(aValue) && !isNaN(bValue)) {
                    return sortConfig.direction === 'asc'
                        ? Number(aValue) - Number(bValue)
                        : Number(bValue) - Number(aValue);
                }

                // Handle string values
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [data, searchTerm, columnFilters, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

    // Handle sorting
    const handleSort = (column) => {
        let direction = 'asc';
        if (sortConfig.key === column && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key: column, direction });
    };

    // Handle column filter change
    const handleColumnFilterChange = (column, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [column]: value
        }));
        setCurrentPage(1); // Reset to first page when filter changes
    };

    // Reset current page when data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [data]);

    return (
        <div className={`w-full ${compact ? 'data-table-container compact' : 'data-table-container'}`}>
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4 bg-white p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {title && (
                        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                    )}
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900
                                 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Rows per page:</label>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900
                                 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                 cursor-pointer"
                    >
                        {[5, 10, 25, 50, 100].map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            {columns.map((column) => (
                                <th
                                    key={column}
                                    onClick={() => handleSort(column)}
                                    className={`px-4 py-3 text-left text-sm font-medium text-gray-700
                                             ${sortConfig.key === column ? 'cursor-pointer hover:bg-gray-100' : ''}
                                             ${compact ? 'py-2' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{column}</span>
                                        {sortConfig.key === column && (
                                            <span className="text-gray-400">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={`Filter ${column}`}
                                        value={columnFilters[column] || ''}
                                        onChange={(e) => handleColumnFilterChange(column, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`bg-white border-b border-gray-100 last:border-0
                                             ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                                             ${hoveredRow === rowIndex ? 'bg-gray-50' : ''}`}
                                    onMouseEnter={() => setHoveredRow(rowIndex)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={`${rowIndex}-${column}`}
                                            className={`px-4 text-sm text-gray-900 ${compact ? 'py-2' : 'py-3'}`}
                                        >
                                            {row[column] !== null && row[column] !== undefined ? String(row[column]) : ''}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                >
                                    No data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 bg-white p-4 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} results
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700
                                 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
                                 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        First
                    </button>
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700
                                 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
                                 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        Prev
                    </button>

                    <div className="flex items-center px-2">
                        <span className="text-sm text-gray-700">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                    </div>

                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700
                                 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
                                 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        Next
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700
                                 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
                                 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        Last
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataTable;