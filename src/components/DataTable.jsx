import React, { useState, useEffect } from 'react';

const DataTable = ({ data, title, compact = false, pageSizeOptions = [10, 25, 50, 100], defaultPageSize = 10 }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [filters, setFilters] = useState({});
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredRow, setHoveredRow] = useState(null);

    // Initialize filtered data
    useEffect(() => {
        if (!data || data.length === 0) {
            setFilteredData([]);
            return;
        }

        let result = [...data];

        // Apply search term filter across all columns
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            result = result.filter(row =>
                Object.values(row).some(value =>
                    String(value).toLowerCase().includes(lowerSearchTerm)
                )
            );
        }

        // Apply column-specific filters
        Object.keys(filters).forEach(column => {
            if (filters[column]) {
                const filterValue = filters[column].toLowerCase();
                result = result.filter(row =>
                    String(row[column]).toLowerCase().includes(filterValue)
                );
            }
        });

        // Apply sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                // Handle numeric sorting
                if (!isNaN(parseFloat(a[sortConfig.key])) && !isNaN(parseFloat(b[sortConfig.key]))) {
                    return sortConfig.direction === 'asc'
                        ? parseFloat(a[sortConfig.key]) - parseFloat(b[sortConfig.key])
                        : parseFloat(b[sortConfig.key]) - parseFloat(a[sortConfig.key]);
                }

                // Handle string sorting
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        setFilteredData(result);
    }, [data, sortConfig, filters, searchTerm]);

    useEffect(() => {
        // Update page size if defaultPageSize changes
        setPageSize(defaultPageSize);
    }, [defaultPageSize]);

    if (!data || data.length === 0) {
        return (
            <div className={`data-table-empty ${compact ? 'compact' : ''}`}>
                <p>No data available</p>
            </div>
        );
    }

    // Extract column headers from the first data object
    const columns = Object.keys(data[0]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

    // Format column name for display
    const formatColumnName = (name) => {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Format cell value based on type
    const formatCellValue = (value, column) => {
        if (value === null || value === undefined) return '-';

        // Format numbers with commas
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
            // Format monetary values with $ sign if the column name suggests money
            const isMonetary = /price|cost|amount|total|revenue|sales/i.test(column);
            return isMonetary
                ? '$' + new Intl.NumberFormat().format(value)
                : new Intl.NumberFormat().format(value);
        }

        // Format dates if they look like dates
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            try {
                return new Date(value).toLocaleDateString();
            } catch (e) {
                return value;
            }
        }

        return String(value);
    };

    // Handle sorting
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Get sort direction indicator
    const getSortDirectionIndicator = (column) => {
        if (sortConfig.key !== column) return null;
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    // Handle filter change
    const handleFilterChange = (column, value) => {
        setFilters(prev => ({
            ...prev,
            [column]: value
        }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Handle page size change
    const handlePageSizeChange = (event) => {
        setPageSize(Number(event.target.value));
        setCurrentPage(1); // Reset to first page when changing page size
    };

    // Get css class for row (for zebra striping)
    const getRowClass = (index) => {
        const isEven = index % 2 === 0;
        const isHovered = index === hoveredRow;

        return `${isEven ? 'even-row' : 'odd-row'} ${isHovered ? 'hovered-row' : ''}`;
    };

    const containerClass = `data-table-container ${compact ? 'compact' : ''}`;

    return (
        <div className={containerClass}>
            <div className="data-table-header">
                {title && <h3 className="data-table-title">{title}</h3>}

                <div className="data-table-controls">
                    <div className="data-table-search">
                        <input
                            type="text"
                            placeholder="Search all columns..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page when searching
                            }}
                            className="data-table-search-input"
                        />
                    </div>

                    <div className="data-table-page-size">
                        <span className="rows-per-page-label">Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="data-table-page-size-select"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className={`data-table-wrapper ${compact ? 'compact' : ''}`}>
                <table className={`data-table ${compact ? 'compact' : ''}`}>
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column}
                                    onClick={() => requestSort(column)}
                                    className={sortConfig.key === column ? 'sorted' : ''}
                                >
                                    <div className="column-header">
                                        <span className="column-title">
                                            {formatColumnName(column)}
                                            <span className="sort-indicator">
                                                {getSortDirectionIndicator(column)}
                                            </span>
                                        </span>
                                    </div>
                                    {!compact && (
                                        <div className="column-filter">
                                            <input
                                                type="text"
                                                placeholder="Filter..."
                                                value={filters[column] || ''}
                                                onChange={(e) => handleFilterChange(column, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="column-filter-input"
                                            />
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={getRowClass(rowIndex)}
                                onMouseEnter={() => setHoveredRow(rowIndex)}
                                onMouseLeave={() => setHoveredRow(null)}
                            >
                                {columns.map((column) => (
                                    <td key={`${rowIndex}-${column}`} className={column.toLowerCase().includes('id') ? 'id-column' : ''}>
                                        {formatCellValue(row[column], column)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="data-table-footer">
                <div className="data-table-info">
                    <span>
                        Showing {paginatedData.length} of {filteredData.length} entries
                        {filteredData.length !== data.length && ` (filtered from ${data.length} total entries)`}
                    </span>
                </div>

                {totalPages > 1 && (
                    <div className="data-table-pagination">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className="pagination-button first-page"
                            title="First page"
                        >
                            &laquo;
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="pagination-button prev-page"
                            title="Previous page"
                        >
                            &lsaquo;
                        </button>

                        <div className="pagination-numbers">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return pageNum > 0 && pageNum <= totalPages ? (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                                    >
                                        {pageNum}
                                    </button>
                                ) : null;
                            })}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="pagination-button next-page"
                            title="Next page"
                        >
                            &rsaquo;
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="pagination-button last-page"
                            title="Last page"
                        >
                            &raquo;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataTable;
