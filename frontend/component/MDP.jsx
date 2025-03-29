import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';

export default function MDP() {
    const [data, setData] = useState({
        data_mds: [],
        variable_mds: [],
        optimal_k: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clusters, setClusters] = useState(3);
    const [findOptimal, setFindOptimal] = useState(true);
    // Add state for selected variables
    const [selectedVariables, setSelectedVariables] = useState([]);

    const dataPlotRef = useRef();
    const variablePlotRef = useRef();

    useEffect(() => {
        fetchMDSData();
    }, [clusters, findOptimal]);

    const fetchMDSData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://127.0.0.1:8000/mdp', {
                params: {
                    clusters: clusters,
                    find_optimal: findOptimal
                }
            });
            setData(response.data);
            console.log('MDS data received:', response.data);
        } catch (err) {
            console.error("Error fetching MDS data:", err);
            setError("Failed to load MDS data. Please check if the backend server is running.");
        } finally {
            setIsLoading(false);
        }
    };

    // Create data point MDS plot
    useEffect(() => {
        if (!data.data_mds || data.data_mds.length === 0) return;

        createDataMDSPlot();
    }, [data.data_mds]);

    // Create variable MDS plot
    useEffect(() => {
        if (!data.variable_mds || data.variable_mds.length === 0) return;
        createVariableMDSPlot();
    }, [data.variable_mds, selectedVariables]);

    const createDataMDSPlot = () => {
        const svg = d3.select(dataPlotRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 30, right: 30, bottom: 50, left: 50 };
        const width = 600 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const xExtent = d3.extent(data.data_mds, d => d.x);
        const yExtent = d3.extent(data.data_mds, d => d.y);

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

        // Color scale for clusters
        const clusterCount = Math.max(...data.data_mds.map(d => d.cluster)) + 1;
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(Array.from({ length: clusterCount }, (_, i) => i));

        // Plot points
        g.selectAll("circle")
            .data(data.data_mds)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", 4)
            .attr("fill", d => colorScale(d.cluster))
            .attr("opacity", 0.7)
            .append("title")
            .text(d => `Point: (${d.x.toFixed(2)}, ${d.y.toFixed(2)}) - Cluster: ${d.cluster}`);

        // Add legend
        const legend = g.append("g")
            .attr("transform", `translate(${width - 100}, 10)`);

        for (let i = 0; i < clusterCount; i++) {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", colorScale(i));

            legendRow.append("text")
                .attr("x", 20)
                .attr("y", 10)
                .attr("text-anchor", "start")
                .style("font-size", "12px")
                .text(`Cluster ${i}`);
        }
    };

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
                    // Create a color gradient based on selection order
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

        // Add a selection list
        if (selectedVariables.length > 0) {
            // Create a semi-transparent background for the selection list
            const panelWidth = 180;
            const panelHeight = Math.min(150, 25 + selectedVariables.length * 18);
            const panelX = width - panelWidth - 10;
            const panelY = 10;

            g.append("rect")
                .attr("x", panelX)
                .attr("y", panelY)
                .attr("width", panelWidth)
                .attr("height", panelHeight)
                .attr("fill", "white")
                .attr("opacity", 0.85)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("stroke", "#ddd")
                .attr("stroke-width", 1);

            const legend = g.append("g")
                .attr("transform", `translate(${panelX + 10}, ${panelY + 20})`);

            legend.append("text")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .text("Selected Variables:");

            selectedVariables.forEach((variable, i) => {
                legend.append("text")
                    .attr("y", (i + 1) * 18)
                    .style("font-size", "11px")
                    .text(`${i + 1}. ${variable}`);

                // Add a remove button
                legend.append("text")
                    .attr("x", panelWidth - 30)
                    .attr("y", (i + 1) * 18)
                    .style("font-size", "10px")
                    .style("fill", "red")
                    .style("cursor", "pointer")
                    .text("✕")
                    .on("click", function () {
                        // Remove this variable from selection
                        setSelectedVariables(prev => prev.filter(v => v !== variable));
                    });
            });
        }
    };

    const resetSelections = () => {
        setSelectedVariables([]);
    };


    return (
        <div className="mt-20 rounded-lg shadow-lg bg-white p-6 max-w-6xl mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Multidimensional Scaling (MDS)</h2>
                <p className="text-gray-600 mt-1">
                    Visualizing data points and variables in reduced dimensions
                    {data.optimal_k && <span> with pre computed optimal cluster value of "{data.optimal_k}"</span>}
                </p>
            </div>


            {isLoading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-600">Loading MDS visualization...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700">{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold mb-2 text-gray-700 text-center">
                            Data Points MDS
                        </h3>
                        <svg
                            ref={dataPlotRef}
                            viewBox="0 0 600 500"
                            className="w-full h-auto"
                            preserveAspectRatio="xMidYMid meet"
                        ></svg>
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold mb-2 text-gray-700 text-center">
                            Variables MDS
                        </h3>
                        <p className="text-xs text-center text-gray-500 mb-2">
                            Click on variables to select them for PCP axis ordering
                        </p>
                        <svg
                            ref={variablePlotRef}
                            viewBox="0 0 600 500"
                            className="w-full h-auto"
                            preserveAspectRatio="xMidYMid meet"
                        ></svg>

                        {/* Add buttons for selection management */}
                        <div className="flex justify-center mt-3 space-x-2">
                            <button
                                onClick={resetSelections}
                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                                disabled={selectedVariables.length === 0}
                            >
                                Reset Selection
                            </button>
                            {selectedVariables.length > 0 && (
                                <button
                                    onClick={() => {
                                        // This will be used in MDP_Layout to pass to PDP
                                        console.log("Selected variables for PCP:", selectedVariables);
                                        // Signal event for parent component
                                        window.dispatchEvent(new CustomEvent('updatePCPOrder', {
                                            detail: { variables: selectedVariables }
                                        }));
                                    }}
                                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                                >
                                    Apply to PCP
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && !error && data.variable_mds.length > 0 && (
                <div className="mb-4 flex justify-center space-x-4">

                </div>
            )}


        </div>
    );
}