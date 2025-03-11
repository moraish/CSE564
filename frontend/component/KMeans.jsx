import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as d3 from 'd3';

const KMeans = ({ clusters, setClusters, colorScale }) => {
    // Existing state declarations
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const svgRef = useRef();
    const elbowRef = useRef();
    const [dimensions, setDimensions] = useState(2);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://127.0.0.1:8000/kmeans?clusters=${clusters}&dimensions=${dimensions}`);
                setData(response.data);
                setError(null);
                console.log("Received K-means data:", response.data);
            } catch (err) {
                setError('Failed to fetch K-means data');
                console.error('Error fetching K-means data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [clusters, dimensions]);

    useEffect(() => {
        if (!data || !svgRef.current || !elbowRef.current) return;

        createKMeansPlot();
        createElbowPlot();
    }, [data]);

    const createKMeansPlot = () => {
        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        const { pcaData, clusterLabels, optimalK } = data;
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Create SVG element with responsive viewBox
        const svg = d3.select(svgRef.current)
            .attr('width', '100%')
            .attr('height', height + margin.top + margin.bottom)
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Add gradient background
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "kmeans-bg-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#f8f9fa")
            .attr("stop-opacity", 0.8);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#e9ecef")
            .attr("stop-opacity", 0.8);

        svg.append("rect")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("x", -margin.left)
            .attr("y", -margin.top)
            .attr("fill", "url(#kmeans-bg-gradient)");

        // Add title with background
        const titleG = svg.append("g")
            .attr("class", "title-container");

        titleG.append("rect")
            .attr("x", width / 2 - 150)
            .attr("y", -margin.top + 10)
            .attr("width", 300)
            .attr("height", 30)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("fill", "#264653")
            .attr("opacity", 0.8);

        titleG.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top + 30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .text(`K-Means Clustering (k=${optimalK})`);

        // Define scales
        const xExtent = d3.extent(pcaData, d => d[0]);
        const yExtent = d3.extent(pcaData, d => d[1]);

        // Add padding to the extents
        const xPadding = (xExtent[1] - xExtent[0]) * 0.05;
        const yPadding = (yExtent[1] - yExtent[0]) * 0.05;

        const xScale = d3.scaleLinear()
            .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
            .range([height, 0]);

        // Create color scale for clusters
        const colorScale = d3.scaleOrdinal()
            .domain([...Array(optimalK).keys()])
            .range(d3.schemeCategory10);

        // Add axes
        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale))
            .call(g => g.append('text')
                .attr('x', width / 2)
                .attr('y', 40)
                .attr('fill', 'currentColor')
                .attr('text-anchor', 'middle')
                .text('Principal Component 1'));

        svg.append('g')
            .call(d3.axisLeft(yScale))
            .call(g => g.append('text')
                .attr('x', -height / 2)
                .attr('y', -40)
                .attr('fill', 'currentColor')
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(-90)')
                .text('Principal Component 2'));

        // Add pointsScale
        const pointColorScale = colorScale || d3.scaleOrdinal()
            .domain([...Array(optimalK).keys()])
            .range(d3.schemeCategory10);

        // Add points
        const points = svg.selectAll('circle')
            .data(pcaData)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d[0]))
            .attr('cy', d => yScale(d[1]))
            .attr('r', 0)
            .style('fill', (_, i) => pointColorScale(clusterLabels[i]))
            .style('stroke', '#fff')
            .style('stroke-width', 1)
            .style('opacity', 0.7);

        // Animate points appearance
        points.transition()
            .duration(800)
            .delay((_, i) => i * 5)
            .attr('r', 5);

        // Add hover effects
        points.on('mouseover', function (event, d) {
            d3.select(this)
                .attr('r', 8)
                .style('opacity', 1);

            const i = pcaData.findIndex(p => p[0] === d[0] && p[1] === d[1]);
            const cluster = clusterLabels[i];

            // Add tooltip
            svg.append('text')
                .attr('class', 'tooltip')
                .attr('x', xScale(d[0]))
                .attr('y', yScale(d[1]) - 10)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .text(`Cluster ${cluster + 1}`);
        })
            .on('mouseout', function () {
                d3.select(this)
                    .attr('r', 5)
                    .style('opacity', 0.7);

                svg.selectAll('.tooltip').remove();
            });

        // Add legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 100}, 20)`);

        for (let i = 0; i < optimalK; i++) {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);

            legendRow.append('rect')
                .attr('width', 10)
                .attr('height', 10)
                .attr('fill', pointColorScale(i));

            legendRow.append('text')
                .attr('x', 20)
                .attr('y', 10)
                .attr('text-anchor', 'start')
                .style('font-size', '12px')
                .text(`Cluster ${i + 1}`);
        }
    };

    const createElbowPlot = () => {
        // Clear previous chart
        d3.select(elbowRef.current).selectAll('*').remove();

        const { elbowData, optimalK } = data;
        const { kValues, inertia } = elbowData;

        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        // Create SVG element
        const svg = d3.select(elbowRef.current)
            .attr('width', '100%')
            .attr('height', height + margin.top + margin.bottom)
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Add gradient background
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "elbow-bg-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#f8f9fa")
            .attr("stop-opacity", 0.8);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#e9ecef")
            .attr("stop-opacity", 0.8);

        svg.append("rect")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("x", -margin.left)
            .attr("y", -margin.top)
            .attr("fill", "url(#elbow-bg-gradient)");

        // Add title
        const titleG = svg.append("g")
            .attr("class", "title-container");

        titleG.append("rect")
            .attr("x", width / 2 - 100)
            .attr("y", -margin.top + 10)
            .attr("width", 200)
            .attr("height", 30)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("fill", "#264653")
            .attr("opacity", 0.8);

        titleG.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top + 30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .text("Elbow Method");

        // Define scales
        const xScale = d3.scaleLinear()
            .domain([d3.min(kValues), d3.max(kValues)])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(inertia) * 1.1])
            .range([height, 0]);

        // Add axes
        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
            .call(g => g.append('text')
                .attr('x', width / 2)
                .attr('y', 40)
                .attr('fill', 'currentColor')
                .attr('text-anchor', 'middle')
                .text('Number of Clusters (k)'));

        svg.append('g')
            .call(d3.axisLeft(yScale))
            .call(g => g.append('text')
                .attr('x', -height / 2)
                .attr('y', -40)
                .attr('fill', 'currentColor')
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(-90)')
                .text('Inertia (Within-Cluster Sum of Squares)'));

        // Create line generator
        const line = d3.line()
            .x((d, i) => xScale(kValues[i]))
            .y((d, i) => yScale(d));

        // Add the line path
        svg.append('path')
            .datum(inertia)
            .attr('fill', 'none')
            .attr('stroke', '#2a9d8f')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Add points
        svg.selectAll('circle')
            .data(inertia)
            .enter()
            .append('circle')
            .attr('cx', (d, i) => xScale(kValues[i]))
            .attr('cy', d => yScale(d))
            .attr('r', 4)
            .attr('fill', (d, i) => kValues[i] === optimalK ? '#e76f51' : '#2a9d8f')
            .attr('stroke', 'white')
            .attr('stroke-width', 1);

        // Mark the optimal k
        svg.append('circle')
            .attr('cx', xScale(optimalK))
            .attr('cy', yScale(inertia[kValues.indexOf(optimalK)]))
            .attr('r', 8)
            .attr('fill', 'none')
            .attr('stroke', '#e76f51')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '3,3');

        svg.append('text')
            .attr('x', xScale(optimalK))
            .attr('y', yScale(inertia[kValues.indexOf(optimalK)]) - 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#e76f51')
            .text(`Optimal k = ${optimalK}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-3 text-gray-700">Loading K-means clustering data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-500">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="rounded-lg shadow-lg bg-white p-6 max-w-6xl mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">K-Means Clustering</h2>
                <p className="text-gray-600 mt-1">
                    Visualizing data clusters using K-Means algorithm with PCA
                </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <div className="w-full md:w-auto">
                        <label htmlFor="clusters" className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Clusters (k)
                        </label>
                        <div className="flex items-center">
                            <input
                                type="range"
                                id="clusters"
                                min="2"
                                max="10"
                                value={clusters}
                                onChange={(e) => setClusters(parseInt(e.target.value))}
                                className="w-48 h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="ml-3 w-8 text-center">{clusters}</span>
                        </div>
                    </div>

                    <div className="w-full md:w-auto">
                        <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700 mb-1">
                            PCA Dimensions
                        </label>
                        <div className="flex items-center">
                            <input
                                type="range"
                                id="dimensions"
                                min="2"
                                max="5"
                                value={dimensions}
                                onChange={(e) => setDimensions(parseInt(e.target.value))}
                                className="w-48 h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="ml-3 w-8 text-center">{dimensions}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setClusters(3);
                            setDimensions(2);
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm transition duration-200 mt-4 md:mt-0"
                    >
                        Reset to Defaults
                    </button>
                </div>
            </div>

            {/* K-means clustering visualization */}
            <div className="bg-white p-4 rounded shadow-sm mb-6">
                <svg ref={svgRef} className="w-full"></svg>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-md mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Interpretation</h3>
                <p className="text-sm text-gray-600">
                    This visualization shows K-means clustering results on PCA-reduced data. The main plot displays data points
                    colored by their assigned cluster. The elbow plot below shows the "Elbow Method" used to determine the optimal
                    number of clusters (k), where the point of inflection suggests the most appropriate value of k.
                    The optimal k value of {data.optimalK} was automatically selected based on the point where adding more
                    clusters provides diminishing returns in reducing inertia.
                </p>
            </div>

            {/* Elbow method visualization */}
            <div className="bg-white p-4 rounded shadow-sm">
                <svg ref={elbowRef} className="w-full"></svg>
            </div>
        </div>
    );
};

export default KMeans;