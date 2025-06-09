import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter,
    AreaChart, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, Cell, Label
} from 'recharts';

const VisualizationChart = ({ data, title, description }) => {
    const [chartType, setChartType] = useState('bar');
    const [xAxis, setXAxis] = useState('');
    const [yAxis, setYAxis] = useState('');
    const [chartData, setChartData] = useState([]);
    const [colorScheme, setColorScheme] = useState('default');

    // Color schemes
    const colorSchemes = {
        default: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
        blue: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'],
        green: ['#d8f3dc', '#b7e4c7', '#95d5b2', '#74c69d', '#52b788', '#40916c', '#2d6a4f', '#1b4332'],
        pastel: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'],
        vibrant: ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590']
    };

    // Format column name for display
    const formatColumnName = (name) => {
        if (!name) return '';
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Prepare chart data when axes or data change
    useEffect(() => {
        if (!data || data.length === 0 || !xAxis || !yAxis) {
            setChartData([]);
            return;
        }

        // Format data for the chart
        const formattedData = data.map(item => {
            // Handle numeric values for y-axis
            let yValue = parseFloat(item[yAxis]);
            if (isNaN(yValue)) yValue = 0;

            return {
                name: String(item[xAxis]),
                value: yValue,
                // Keep the original values for tooltip
                originalX: item[xAxis],
                originalY: item[yAxis]
            };
        });

        // Sort data for bar charts
        if (chartType === 'bar') {
            formattedData.sort((a, b) => b.value - a.value);
        }

        // Limit data points for better visualization
        const maxDataPoints = 20;
        const limitedData = formattedData.slice(0, maxDataPoints);

        setChartData(limitedData);
    }, [data, xAxis, yAxis, chartType]);

    // Get the columns that could be used for visualization
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    // Get numeric columns for y-axis
    const numericColumns = columns.filter(col => {
        if (!data || data.length === 0) return false;
        const sample = data[0][col];
        return !isNaN(parseFloat(sample)) && isFinite(sample);
    });

    // Format value for tooltip
    const formatValue = (value) => {
        if (typeof value === 'number') {
            return new Intl.NumberFormat().format(value);
        }
        return value;
    };

    // Render the appropriate chart based on chartType
    const renderChart = () => {
        if (!chartData || chartData.length === 0) {
            return (
                <div className="chart-placeholder">
                    <div className="placeholder-text">
                        {!xAxis || !yAxis ? (
                            <p>Select columns for X and Y axes to generate a chart</p>
                        ) : (
                            <p>No data available for the selected columns</p>
                        )}
                    </div>
                </div>
            );
        }

        const colors = colorSchemes[colorScheme] || colorSchemes.default;

        switch (chartType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 12 }}
                            >
                                <Label value={formatColumnName(xAxis)} position="insideBottom" offset={-50} />
                            </XAxis>
                            <YAxis tick={{ fontSize: 12 }}>
                                <Label
                                    value={formatColumnName(yAxis)}
                                    angle={-90}
                                    position="insideLeft"
                                    style={{ textAnchor: 'middle' }}
                                />
                            </YAxis>
                            <Tooltip
                                formatter={(value) => [formatValue(value), formatColumnName(yAxis)]}
                                labelFormatter={(label) => `${formatColumnName(xAxis)}: ${label}`}
                            />
                            <Legend />
                            <Bar
                                dataKey="value"
                                name={formatColumnName(yAxis)}
                                fill={colors[0]}
                                radius={[4, 4, 0, 0]}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 12 }}
                            >
                                <Label value={formatColumnName(xAxis)} position="insideBottom" offset={-50} />
                            </XAxis>
                            <YAxis tick={{ fontSize: 12 }}>
                                <Label
                                    value={formatColumnName(yAxis)}
                                    angle={-90}
                                    position="insideLeft"
                                    style={{ textAnchor: 'middle' }}
                                />
                            </YAxis>
                            <Tooltip
                                formatter={(value) => [formatValue(value), formatColumnName(yAxis)]}
                                labelFormatter={(label) => `${formatColumnName(xAxis)}: ${label}`}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                name={formatColumnName(yAxis)}
                                stroke={colors[0]}
                                strokeWidth={2}
                                dot={{ stroke: colors[0], strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [formatValue(value), formatColumnName(yAxis)]}
                                labelFormatter={(label) => `${formatColumnName(xAxis)}: ${label}`}
                            />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 12 }}
                            >
                                <Label value={formatColumnName(xAxis)} position="insideBottom" offset={-50} />
                            </XAxis>
                            <YAxis tick={{ fontSize: 12 }}>
                                <Label
                                    value={formatColumnName(yAxis)}
                                    angle={-90}
                                    position="insideLeft"
                                    style={{ textAnchor: 'middle' }}
                                />
                            </YAxis>
                            <Tooltip
                                formatter={(value) => [formatValue(value), formatColumnName(yAxis)]}
                                labelFormatter={(label) => `${formatColumnName(xAxis)}: ${label}`}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="value"
                                name={formatColumnName(yAxis)}
                                stroke={colors[0]}
                                fill={colors[0]}
                                fillOpacity={0.3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                type="category"
                                name={formatColumnName(xAxis)}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 12 }}
                            >
                                <Label value={formatColumnName(xAxis)} position="insideBottom" offset={-50} />
                            </XAxis>
                            <YAxis
                                dataKey="value"
                                name={formatColumnName(yAxis)}
                                tick={{ fontSize: 12 }}
                            >
                                <Label
                                    value={formatColumnName(yAxis)}
                                    angle={-90}
                                    position="insideLeft"
                                    style={{ textAnchor: 'middle' }}
                                />
                            </YAxis>
                            <Tooltip
                                formatter={(value) => [formatValue(value), formatColumnName(yAxis)]}
                                labelFormatter={(name) => `${formatColumnName(xAxis)}: ${name}`}
                                cursor={{ strokeDasharray: '3 3' }}
                            />
                            <Legend />
                            <Scatter
                                name={`${formatColumnName(xAxis)} vs ${formatColumnName(yAxis)}`}
                                data={chartData}
                                fill={colors[0]}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            default:
                return <div>Select a chart type</div>;
        }
    };

    return (
        <div className="visualization-chart-container">
            {title && (
                <h3 className="chart-title">{title}</h3>
            )}

            <div className="chart-controls">
                <div className="control-group">
                    <label>Chart Type</label>
                    <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        className="chart-control-select"
                    >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="area">Area Chart</option>
                        <option value="scatter">Scatter Plot</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>X-Axis</label>
                    <select
                        value={xAxis}
                        onChange={(e) => setXAxis(e.target.value)}
                        className="chart-control-select"
                    >
                        <option value="">Select column</option>
                        {columns.map(col => (
                            <option key={col} value={col}>{formatColumnName(col)}</option>
                        ))}
                    </select>
                </div>

                <div className="control-group">
                    <label>Y-Axis</label>
                    <select
                        value={yAxis}
                        onChange={(e) => setYAxis(e.target.value)}
                        className="chart-control-select"
                    >
                        <option value="">Select column</option>
                        {numericColumns.map(col => (
                            <option key={col} value={col}>{formatColumnName(col)}</option>
                        ))}
                    </select>
                </div>

                <div className="control-group">
                    <label>Color Scheme</label>
                    <select
                        value={colorScheme}
                        onChange={(e) => setColorScheme(e.target.value)}
                        className="chart-control-select"
                    >
                        <option value="default">Default</option>
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="pastel">Pastel</option>
                        <option value="vibrant">Vibrant</option>
                    </select>
                </div>
            </div>

            <div className="chart-container">
                {renderChart()}
            </div>

            {description && (
                <div className="chart-description">
                    <p>{description}</p>
                </div>
            )}
        </div>
    );
};

export default VisualizationChart;
