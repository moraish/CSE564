import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';

export default function PCP() {
    const [data, setData] = useState({
        records: [],
        axes: [],
        encoders: {}
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [axisOrder, setAxisOrder] = useState([]);
    const [colorByCluster, setColorByCluster] = useState(true);
    const [clusterData, setClusterData] = useState([]);
    const [clusterCount, setClusterCount] = useState(3);
    // Add state to track if the axis order was set from MDS
    const [orderFromMDS, setOrderFromMDS] = useState(false);

    const plotRef = useRef();
    const draggedAxisRef = useRef(null);

    useEffect(() => {
        // Fetch parallel coordinates data
        fetchPDPData();
        // Fetch cluster data for coloring
        fetchClusterData();

        // Listen for updatePCPOrder events from MDS component
        const handleUpdatePCPOrder = (event) => {
            const { variables } = event.detail;
            if (variables && variables.length > 0) {
                // Update axis order with selected variables
                updateAxisOrderFromMDS(variables);
            }
        };

        window.addEventListener('updatePCPOrder', handleUpdatePCPOrder);

        // Cleanup
        return () => {
            window.removeEventListener('updatePCPOrder', handleUpdatePCPOrder);
        };
    }, []);

    // With this updated version
    useEffect(() => {
        // Fetch parallel coordinates data
        fetchPDPData();
        // Fetch cluster data for coloring
        fetchClusterData();
    }, []);

    // useEffect(() => {
    //     // Reset selections when data changes
    //     setSelectedVariables([]);
    // }, [data.variable_mds]);

    // Add a new useEffect specifically for event handling
    useEffect(() => {
        // Listen for updatePCPOrder events from MDS component
        const handleUpdatePCPOrder = (event) => {
            const { variables } = event.detail;
            if (variables && variables.length > 0 && data.axes.length > 0) {
                // Update axis order with selected variables
                updateAxisOrderFromMDS(variables);
            }
        };

        // Only add event listener if data is loaded
        if (data.axes.length > 0) {
            window.addEventListener('updatePCPOrder', handleUpdatePCPOrder);

            // Cleanup
            return () => {
                window.removeEventListener('updatePCPOrder', handleUpdatePCPOrder);
            };
        }
    }, [data.axes]);

    const updateAxisOrderFromMDS = (variables) => {
        console.log("PDP: Received variables from MDS:", variables);
        console.log("PDP: Current axis order:", axisOrder);
        console.log("PDP: Available axes:", data.axes.map(a => a.name));

        // Filter to include only variables that exist in the current dataset
        const validVariables = variables.filter(v =>
            data.axes.some(axis => axis.name === v)
        );

        console.log("PDP: Valid variables:", validVariables);

        if (validVariables.length === 0) {
            console.warn("None of the selected variables from MDS exist in the PDP dataset");
            return;
        }

        // Get all available axes
        const allAxes = data.axes.map(axis => axis.name);

        // Get axes that were not selected in MDS
        const remainingAxes = allAxes.filter(axis => !validVariables.includes(axis));

        console.log("PDP: Remaining axes:", remainingAxes);

        // Update axis order with selected variables first, followed by remaining axes
        const newOrder = [...validVariables, ...remainingAxes];

        console.log("PDP: New axis order:", newOrder);

        if (newOrder.length > 0) {
            setAxisOrder(newOrder);
            setOrderFromMDS(true);

            // Scroll to PCP section
            setTimeout(() => {
                document.querySelector('.pdp-container')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    };

    useEffect(() => {
        // Once data is loaded and axis order is established, create the visualization
        if (data.records.length > 0 && axisOrder.length > 0) {
            createParallelCoordinatesPlot();
        }
    }, [data, axisOrder, colorByCluster, clusterData]);

    // Create variable MDS plot
    // useEffect(() => {
    //     if (!data.variable_mds || data.variable_mds.length === 0) return;

    //     createVariableMDSPlot();
    // }, [data.variable_mds, selectedVariables]);

    // Update the createVariableMDSPlot function to handle multiple selections correctly

    const createVariableMDSPlot = () => {
        const svg = d3.select(variablePlotRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 30, right: 30, bottom: 50, left: 50 };
        const width = 600 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const xExtent = d3.extent(data.variable_mds, d => d.x);
        const yExtent = d3.extent(data.variable_mds, d => d.y);

        const xScale = d3.scaleLinear()
            .domain([xExtent[0] * 1.1, xExtent[1] * 1.1])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([yExtent[0] * 1.1, yExtent[1] * 1.1])
            .range([height, 0]);

        // Create axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "black")
            .style("font-size", "14px")
            .style("text-anchor", "middle")
            .text("MDS Dimension 1");

        g.append("g")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height / 2)
            .attr("fill", "black")
            .style("font-size", "14px")
            .style("text-anchor", "middle")
            .text("MDS Dimension 2");

        // Plot points with variable names
        g.selectAll(".variable-point")
            .data(data.variable_mds)
            .enter()
            .append("circle")
            .attr("class", "variable-point")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", 5)
            .attr("fill", d => {
                // Color points based on selection status
                if (selectedVariables.includes(d.variable)) {
                    // Get index to show selection order
                    const index = selectedVariables.indexOf(d.variable);
                    // Create a color gradient from red to blue based on selection order
                    return d3.interpolateRgb("#ff6b6b", "#1f77b4")(index / Math.max(1, selectedVariables.length - 1));
                }
                return "#1f77b4";
            })
            .attr("stroke", d => selectedVariables.includes(d.variable) ? "#000" : "#555")
            .attr("stroke-width", d => selectedVariables.includes(d.variable) ? 1.5 : 0.5)
            .style("cursor", "pointer")
            // Add click event handler
            .on("click", function (event, d) {
                // Stop the event from propagating
                event.stopPropagation();

                const variable = d.variable;
                setSelectedVariables(prev => {
                    // If already selected, remove it from selection
                    if (prev.includes(variable)) {
                        const newSelection = prev.filter(v => v !== variable);
                        console.log("Removed variable:", variable, "New selection:", newSelection);
                        return newSelection;
                    }
                    // Otherwise add it to selection
                    const newSelection = [...prev, variable];
                    console.log("Added variable:", variable, "New selection:", newSelection);
                    return newSelection;
                });

                // Force re-render after selection change
                setTimeout(() => createVariableMDSPlot(), 50);
            });

        // Add variable names
        g.selectAll(".variable-label")
            .data(data.variable_mds)
            .enter()
            .append("text")
            .attr("class", "variable-label")
            .attr("x", d => xScale(d.x))
            .attr("y", d => yScale(d.y) - 8)
            .attr("text-anchor", "middle")
            .style("font-size", "8px")
            .style("pointer-events", "none")
            .text(d => d.variable);

        // Add numbers indicating selection order
        g.selectAll(".selection-order")
            .data(data.variable_mds.filter(d => selectedVariables.includes(d.variable)))
            .enter()
            .append("text")
            .attr("class", "selection-order")
            .attr("x", d => xScale(d.x))
            .attr("y", d => yScale(d.y) + 4)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .style("pointer-events", "none")
            .text(d => selectedVariables.indexOf(d.variable) + 1);

        // Add a legend for the selected points
        if (selectedVariables.length > 0) {
            const legendX = width - 180;
            const legendY = 20;

            const legend = g.append("g")
                .attr("transform", `translate(${legendX}, ${legendY})`);

            legend.append("text")
                .attr("y", -10)
                .style("font-size", "10px")
                .style("font-weight", "bold")
                .text("Selected Variables (PCP Order):");

            selectedVariables.forEach((variable, i) => {
                legend.append("text")
                    .attr("x", 10)
                    .attr("y", i * 15)
                    .style("font-size", "10px")
                    .text(`${i + 1}. ${variable}`);
            });
        }
    };

    const fetchPDPData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://127.0.0.1:8000/pdp');
            setData(response.data);

            // Initialize axis order once data is loaded
            if (response.data.axes && response.data.axes.length > 0) {
                // Initial axis order is the same as returned from API
                setAxisOrder(response.data.axes.map(axis => axis.name));
            }

            console.log('PDP data received:', response.data);
        } catch (err) {
            console.error("Error fetching PDP data:", err);
            setError("Failed to load parallel coordinates data. Please check if the backend server is running.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClusterData = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/kmeans', {
                params: { clusters: clusterCount }
            });

            // Create a dictionary mapping from record index to cluster label
            const clusters = {};
            response.data.clusterLabels.forEach((label, index) => {
                clusters[index] = label;
            });

            setClusterData(clusters);
            console.log('Cluster data received:', clusters);
        } catch (err) {
            console.error("Error fetching cluster data:", err);
            setColorByCluster(false); // Disable coloring if cluster data can't be fetched
        }
    };

    const createParallelCoordinatesPlot = () => {
        const svg = d3.select(plotRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 80, right: 50, bottom: 50, left: 80 };
        const width = 1000 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales for each dimension
        const scales = {};
        const axisInfo = {};

        // Prepare axis information
        axisOrder.forEach((dimension, i) => {
            const axisData = data.axes.find(a => a.name === dimension);
            axisInfo[dimension] = axisData;

            if (axisData.type === 'numerical') {
                // For numerical dimensions, use linear scale
                scales[dimension] = d3.scaleLinear()
                    .domain([axisData.min, axisData.max])
                    .range([height, 0]);
            } else {
                // For categorical dimensions, use point scale
                const encoder = data.encoders[dimension] || {};
                const categories = Object.keys(encoder).sort((a, b) => encoder[a] - encoder[b]);

                scales[dimension] = d3.scalePoint()
                    .domain(categories)
                    .range([height, 0]);
            }
        });

        // Draw axes 
        const xScale = d3.scalePoint()
            .domain(axisOrder)
            .range([0, width]);

        // Draw lines
        const line = d3.line()
            .defined(d => d !== null && d !== undefined)
            .x((d, i) => xScale(axisOrder[i]))
            .y(d => d);

        // Color scale for clusters
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(Array.from(new Set(Object.values(clusterData))));

        // Draw polylines for each data point
        g.selectAll(".polyline")
            .data(data.records)
            .enter()
            .append("path")
            .attr("class", "polyline")
            .attr("d", (d, idx) => {
                const points = axisOrder.map(dimension => {
                    const value = d[dimension];
                    if (value === null || value === undefined) return null;

                    // Get the appropriate scale for this dimension
                    const scale = scales[dimension];
                    const axisData = axisInfo[dimension];

                    if (axisData.type === 'categorical') {
                        // For categorical data, find the original category name
                        const encoder = data.encoders[dimension] || {};
                        const category = Object.keys(encoder).find(key => encoder[key] === value);
                        return scale(category || value);
                    } else {
                        // For numerical data, use the value directly
                        return scale(value);
                    }
                });

                return line(points);
            })
            .attr("fill", "none")
            .attr("stroke", (d, idx) => {
                if (colorByCluster && clusterData[idx] !== undefined) {
                    return colorScale(clusterData[idx]);
                }
                return "#69b3a2"; // Default color if not using clusters
            })
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.5)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("stroke-width", 3)
                    .attr("stroke-opacity", 1);
            })
            .on("mouseout", function (event, d) {
                d3.select(this)
                    .attr("stroke-width", 1.5)
                    .attr("stroke-opacity", 0.5);
            });

        // Draw axes
        axisOrder.forEach((dimension, i) => {
            const axisData = axisInfo[dimension];
            const scale = scales[dimension];

            const axisG = g.append("g")
                .attr("transform", `translate(${xScale(dimension)}, 0)`)
                .attr("class", "axis")
                .call(d3.axisLeft(scale).ticks(5))
                .style("cursor", "move");

            // Add axis label
            axisG.append("text")
                .attr("y", -30)
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-45)")  // Rotate labels 45 degrees
                .attr("fill", "black")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .text(dimension);


            // Make axes reorderable
            axisG.call(d3.drag()
                .on("start", function (event) {
                    // Store the dragged axis
                    draggedAxisRef.current = dimension;
                    // Highlight the axis being dragged
                    d3.select(this).raise().classed("dragging", true);
                })
                .on("drag", function (event) {
                    // Get the mouse position relative to the SVG container
                    const svgNode = svg.node();
                    const svgRect = svgNode.getBoundingClientRect();
                    const mouseX = event.sourceEvent.clientX - svgRect.left - margin.left;

                    // Find the closest axis to the current mouse position
                    let closestAxis = null;
                    let minDistance = Infinity;

                    axisOrder.forEach(axis => {
                        const axisX = xScale(axis);
                        const distance = Math.abs(mouseX - axisX);

                        if (distance < minDistance) {
                            minDistance = distance;
                            closestAxis = axis;
                        }
                    });

                    // Only update if we're dragging over a different axis and it's close enough
                    if (closestAxis && closestAxis !== draggedAxisRef.current && minDistance < width / axisOrder.length) {
                        const newOrder = [...axisOrder];
                        const fromIndex = newOrder.indexOf(draggedAxisRef.current);
                        const toIndex = newOrder.indexOf(closestAxis);

                        // Remove from old position and insert at new position
                        newOrder.splice(fromIndex, 1);
                        newOrder.splice(toIndex, 0, draggedAxisRef.current);

                        // Update the order state
                        setAxisOrder(newOrder);
                    }
                })
                .on("end", function () {
                    // Clean up
                    d3.select(this).classed("dragging", false);
                    draggedAxisRef.current = null;
                })
            );
        });
    };

    const handleClusterCountChange = (e) => {
        const newCount = parseInt(e.target.value);
        setClusterCount(newCount);
        // Refetch cluster data with new count
        fetchClusterData(newCount);
    };

    return (
        <div className="mt-20 rounded-lg shadow-lg bg-white p-6 max-w-6xl mx-auto pdp-container">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Parallel Coordinates Plot</h2>
                <p className="text-gray-600 mt-1">
                    Visualizing multiple dimensions with polylines for each data point
                </p>
                {orderFromMDS && (
                    <div className="mt-2 text-sm text-blue-600 bg-blue-50 py-1 px-2 rounded inline-block">
                        Axis order set from MDS variable selection
                    </div>
                )}
            </div>


            {isLoading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-600">Loading parallel coordinates visualization...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700">{error}</p>
                </div>
            ) : (
                <div className="border rounded-lg p-4 bg-gray-50 overflow-x-auto">
                    <svg
                        ref={plotRef}
                        width="1000"
                        height="500"
                        viewBox="0 0 1000 500"
                        className="mx-auto"
                        preserveAspectRatio="xMidYMid meet"
                    ></svg>

                    <div className="mt-4 text-center text-sm text-gray-500">
                        <p>Drag axis labels to reorder dimensions or select variables in the MDS plot above</p>
                    </div>
                </div>
            )}


        </div>
    );
}