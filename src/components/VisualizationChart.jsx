import React, { useState } from 'react';

const VisualizationChart = ({ data }) => {
    const [chartType, setChartType] = useState('bar');
    const [xAxis, setXAxis] = useState('');
    const [yAxis, setYAxis] = useState('');

    if (!data || data.length === 0) {
        return <div>No data available for visualization</div>;
    }

    // Get the columns that could be used for visualization
    const columns = Object.keys(data[0]);

    return (
        <div className="visualization-chart">
            <div className="chart-controls">
                <div className="control-group">
                    <label>Chart Type</label>
                    <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                    >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="scatter">Scatter Plot</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>X-Axis</label>
                    <select
                        value={xAxis}
                        onChange={(e) => setXAxis(e.target.value)}
                    >
                        <option value="">Select column</option>
                        {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                        ))}
                    </select>
                </div>

                <div className="control-group">
                    <label>Y-Axis</label>
                    <select
                        value={yAxis}
                        onChange={(e) => setYAxis(e.target.value)}
                    >
                        <option value="">Select column</option>
                        {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="chart-placeholder">
                {/* In a real implementation, you would render a chart library here */}
                <div className="placeholder-text">
                    {!xAxis || !yAxis ? (
                        <p>Select columns for X and Y axes to generate a chart</p>
                    ) : (
                        <p>Chart visualization would render here using {chartType} type with {xAxis} and {yAxis}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisualizationChart;
