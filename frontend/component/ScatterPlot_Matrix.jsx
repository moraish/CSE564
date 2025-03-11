import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as d3 from 'd3';

const ScatterPlot_Matrix = ({ clusterParam = 3 }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nClusters, setNClusters] = useState(clusterParam); // Renamed from cluster to nClusters
    const svgRef = useRef();
    // Removed dimensions state variable and set it as a constant
    const dimensions = 4; // Fixed dimensions parameter

    // Update nClusters if prop changes
    useEffect(() => {
        if (clusterParam !== nClusters) {
            setNClusters(clusterParam);
        }
    }, [clusterParam]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Update API request to use n_clusters parameter instead of cluster
                const baseUrl = "http://127.0.0.1:8000";
                const clustersParam = `&n_clusters=${nClusters}`;

                const [scatterplotResponse, loadingsResponse] = await Promise.all([
                    axios.get(`${baseUrl}/scatterplot_matrix?dimensions=${dimensions}${clustersParam}`),
                    axios.get(`${baseUrl}/pca_loadings?dimensions=${dimensions}`)
                ]);

                const scatterplotData = scatterplotResponse.data.scatterplot_matrix;
                let loadingsData = loadingsResponse.data.loadings;

                console.log("Received scatterplot data:", scatterplotData);
                console.log("Received loadings data:", loadingsData);

                // Transform loadings data if needed
                if (loadingsData && !('tableData' in loadingsData)) {
                    // Assume we got a structure like {feature: [loading1, loading2, ...]}
                    // and transform to {feature: {squared_sum: sum(loadings^2)}}
                    const transformedLoadings = {};

                    Object.entries(loadingsData).forEach(([feature, loadings]) => {
                        if (Array.isArray(loadings)) {
                            // Calculate squared sum
                            const squared_sum = loadings.reduce((sum, val) => sum + val * val, 0);
                            transformedLoadings[feature] = {
                                squared_sum,
                                loadings: loadings
                            };
                        } else {
                            // If it's not an array, just make sure it has squared_sum
                            transformedLoadings[feature] = {
                                ...loadings,
                                squared_sum: loadings.squared_sum || 0
                            };
                        }
                    });

                    loadingsData = transformedLoadings;
                    console.log("Transformed loadings data:", loadingsData);
                } else {
                    // Create compatible structure with the tableData from the API response
                    const transformedLoadings = {};

                    // Convert the structured data to the expected format
                    loadingsData.featureNames.forEach((feature, index) => {
                        transformedLoadings[feature] = {
                            squared_sum: loadingsData.squaredLoadings[index],
                            loadings: loadingsData.allLoadings[index]
                        };
                    });

                    loadingsData = transformedLoadings;
                    console.log("Processed API loadings data:", loadingsData);
                }

                // Combine the data
                const combinedData = {
                    ...scatterplotData,
                    pca_loadings: loadingsData
                };

                setData(combinedData);
                setError(null);
            } catch (err) {
                setError('Failed to fetch data');
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dimensions, nClusters]);

    useEffect(() => {
        if (!data || !svgRef.current) return;
        createScatterplotMatrix();
    }, [data]);

    const createScatterplotMatrix = () => {
        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        const { features, data: plotData } = data;

        // Add console log to debug data structure
        console.log("First few data points:", plotData.slice(0, 3));

        const margin = { top: 40, right: 40, bottom: 40, left: 40 };
        const size = 140;
        const n = features.length;
        const totalWidth = n * size + (n - 1) * 10 + margin.left + margin.right;
        const totalHeight = n * size + (n - 1) * 10 + margin.top + margin.bottom;

        // Create SVG element with responsive viewBox
        const svg = d3.select(svgRef.current)
            .attr('width', '100%')
            .attr('height', totalHeight)
            .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);


        // Add gradient background
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "scatterplot-bg-gradient")
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
            .attr("width", totalWidth)
            .attr("height", totalHeight)
            .attr("x", -margin.left)
            .attr("y", -margin.top)
            .attr("fill", "url(#scatterplot-bg-gradient)");

        // Add title with background
        const titleG = svg.append("g")
            .attr("class", "title-container");

        titleG.append("rect")
            .attr("x", (n * size) / 2 - 150)
            .attr("y", -margin.top + 10)
            .attr("width", 300)
            .attr("height", 30)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("fill", "#264653")
            .attr("opacity", 0.8);

        titleG.append("text")
            .attr("x", (n * size) / 2)
            .attr("y", -margin.top + 30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .text("Scatterplot Matrix of Top Features");

        // Define scales for each feature
        const scales = {};
        features.forEach(feature => {
            scales[feature] = d3.scaleLinear()
                .domain(d3.extent(plotData, d => d[feature]))
                .range([0, size])
                .nice();
        });



        const hasClusterData = plotData.length > 0 && plotData[0].hasOwnProperty('cluster');
        console.log("Has cluster data:", hasClusterData);

        const clusterProperty = 'cluster';

        let pointColorScale;

        if (hasClusterData) {
            // Get unique clusters
            const clusters = [...new Set(plotData.map(d => d.cluster))].sort((a, b) => a - b);

            console.log("Found clusters:", clusters);

            // Create color scale
            pointColorScale = d3.scaleOrdinal()
                .domain(clusters)
                .range(d3.schemeCategory10);
        } else {
            // Default single color if no clusters
            pointColorScale = d3.scaleOrdinal().range(['#4285F4']);
        }

        // First, keep just the color scale part from the first block
        if (hasClusterData) {
            // Get unique clusters
            const clusters = [...new Set(plotData.map(d => d.cluster))].sort((a, b) => a - b);

            // Create color scale
            pointColorScale = d3.scaleOrdinal()
                .domain(clusters)
                .range(clusters.length <= 10 ? d3.schemeCategory10 : d3.schemeTableau10);
        } else {
            // Default single color if no clusters
            pointColorScale = d3.scaleOrdinal().range(['#4285F4']);
        }

        // Then for the second block, adjust the position to avoid overlap
        if (hasClusterData) {
            const legend = svg.append('g')
                .attr('class', 'legend')
                // Move the legend lower to avoid overlap with the title
                .attr('transform', `translate(${(n * size) / 2 - 100}, ${-margin.top / 4})`);

            // Rest of legend creation code...
        }


        // Add a legend if we have cluster data
        if (hasClusterData) {
            const legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${(n * size) / 2 - 100}, ${-margin.top / 2 - 5})`);

            const clusters = [...new Set(plotData.map(d => d.cluster))].sort((a, b) => a - b);

            // Title for legend
            // legend.append('rect')
            //     .attr('x', -10)
            //     .attr('y', -15)
            //     .attr('width', clusters.length * 60 + 20)
            //     .attr('height', 30)
            //     .attr('rx', 5)
            //     .attr('fill', 'white')
            //     .attr('stroke', '#ccc')
            //     .attr('stroke-width', 1)
            //     .attr('opacity', 0.8);

            // // Title for legend
            // legend.append('text')
            //     .attr('x', 0)
            //     .attr('y', -5)
            //     .attr("y", -margin.top + 30)
            //     .attr('text-anchor', 'start')
            //     .style('font-size', '12px')
            //     .style('font-weight', 'bold')
            //     .text('Clusters:');

            // clusters.forEach((cluster, i) => {
            //     const g = legend.append('g')
            //         .attr('transform', `translate(${i * 60}, 0)`);

            //     g.append('rect')
            //         .attr('x', 60)
            //         .attr('width', 12)
            //         .attr('height', 12)
            //         .attr('fill', pointColorScale(cluster));

            //     g.append('text')
            //         .attr('x', 75)
            //         .attr('y', 9)
            //         .attr('text-anchor', 'start')
            //         .style('font-size', '10px')
            //         .text(`${cluster}`);
            // });
        }

        // Create a cell for each pair of features
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const featureX = features[j];
                const featureY = features[i];
                const cell = svg.append('g')
                    .attr('transform', `translate(${j * (size + 10)}, ${i * (size + 10)})`);


                // Add cell background
                cell.append('rect')
                    .attr('width', size)
                    .attr('height', size)
                    .attr('fill', 'white')
                    .attr('stroke', '#ccc')
                    .attr('stroke-width', 1)
                    .attr('rx', 3);

                // Add axis lines
                cell.append('line')
                    .attr('x1', 0)
                    .attr('x2', size)
                    .attr('y1', size)
                    .attr('y2', size)
                    .attr('stroke', '#aaa');

                cell.append('line')
                    .attr('x1', 0)
                    .attr('x2', 0)
                    .attr('y1', 0)
                    .attr('y2', size)
                    .attr('stroke', '#aaa');

                // If it's the diagonal, draw feature name and distribution
                if (i === j) {
                    // Add feature name in a stylish box
                    const labelBox = cell.append('g')
                        .attr('transform', `translate(${size / 2}, ${size / 2})`);

                    labelBox.append('rect')
                        .attr('x', -70)
                        .attr('y', -15)
                        .attr('width', 140)
                        .attr('height', 30)
                        .attr('rx', 4)
                        .attr('fill', '#4285F4')
                        .attr('opacity', 0.1);

                    labelBox.append('text')
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('font-weight', 'bold')
                        .attr('font-size', '12px')
                        .attr('fill', '#264653')
                        .text(featureX);

                    // Create a small histogram
                    const histogram = d3.histogram()
                        .value(d => d[featureX])
                        .domain(scales[featureX].domain())
                        .thresholds(scales[featureX].ticks(10));

                    const bins = histogram(plotData);
                    const maxCount = d3.max(bins, d => d.length);

                    const barWidth = size / bins.length;
                    const heightScale = d3.scaleLinear()
                        .domain([0, maxCount])
                        .range([0, size / 3]);

                    cell.selectAll('.bar')
                        .data(bins)
                        .enter().append('rect')
                        .attr('class', 'bar')
                        .attr('x', d => scales[featureX](d.x0))
                        .attr('width', d => Math.max(0, scales[featureX](d.x1) - scales[featureX](d.x0) - 1))
                        .attr('y', d => size - heightScale(d.length) - size / 3)
                        .attr('height', d => heightScale(d.length))
                        .attr('fill', '#D62828')
                        .attr('opacity', 0.5);
                } else {
                    // Draw scatter plot for this pair of features
                    const dots = cell.selectAll('circle')
                        .data(plotData)
                        .enter()
                        .append('circle')
                        .attr('cx', d => scales[featureX](d[featureX]))
                        .attr('cy', d => size - scales[featureY](d[featureY]))
                        .attr('r', 0)
                        .style('fill', d => hasClusterData ? pointColorScale(d.cluster) : '#4285F4')
                        .style('stroke', '#fff')
                        .style('stroke-width', 0.5)
                        .style('opacity', 0.7);

                    // Animate dots appearance
                    dots.transition()
                        .duration(800)
                        .delay((d, i) => i * 5)
                        .attr('r', 3);

                    // Add hover effects with cluster info
                    dots.on('mouseover', function (event, d) {
                        d3.select(this)
                            .attr('r', 5)
                            .style('opacity', 1)
                            .style('stroke-width', 1.5);

                        // Add tooltip with cluster information if available
                        const tooltipText = hasClusterData
                            ? `(${d[featureX].toFixed(2)}, ${d[featureY].toFixed(2)}) Cluster: ${d.cluster}`
                            : `(${d[featureX].toFixed(2)}, ${d[featureY].toFixed(2)})`;

                        cell.append('text')
                            .attr('class', 'tooltip')
                            .attr('x', scales[featureX](d[featureX]))
                            .attr('y', size - scales[featureY](d[featureY]) - 7)
                            .attr('text-anchor', 'middle')
                            .attr('font-size', '10px')
                            .text(tooltipText);
                    })
                        .on('mouseout', function () {
                            d3.select(this)
                                .attr('r', 3)
                                .style('opacity', 0.7)
                                .style('stroke-width', 0.5);

                            cell.selectAll('.tooltip').remove();
                        });

                    // Get correlation value for this pair
                    const correlation = data.correlation_matrix?.[featureY]?.[featureX] || 0;

                    // Add correlation text
                    cell.append('text')
                        .attr('x', size - 10)
                        .attr('y', 15)
                        .attr('text-anchor', 'end')
                        .attr('font-size', '10px')
                        .attr('fill', correlation > 0 ? '#D62828' : '#264653')
                        .text(`r = ${correlation.toFixed(2)}`);
                }

                // Add axis labels only on the outer edges
                if (i === n - 1) {
                    cell.append('text')
                        .attr('x', size / 2)
                        .attr('y', size + 25)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '10px')
                        .text(featureX);
                }

                if (j === 0) {
                    cell.append('text')
                        .attr('x', -25)
                        .attr('y', size / 2)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('transform', `rotate(-90, -25, ${size / 2})`)
                        .attr('font-size', '10px')
                        .text(featureY);
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-3 text-gray-700">Loading scatterplot matrix...</p>
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
        <div className="mt-20 rounded-lg shadow-lg bg-white p-6 max-w-6xl mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Scatterplot Matrix</h2>
                <p className="text-gray-600 mt-1">
                    Showing relationships between the {data?.features?.length || 0} most important features
                    with {nClusters} clusters
                </p>
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-center">
                {/* Number of clusters slider - kept this one */}
                <div className="w-full max-w-md">
                    <label htmlFor="clusters-slider" className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Clusters: {nClusters}
                    </label>
                    <input
                        type="range"
                        id="clusters-slider"
                        min="2"
                        max="8"
                        value={nClusters}
                        onChange={(e) => setNClusters(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                {/* Removed dimensions/features slider */}
            </div>

            {data.pca_loadings ? (
                <div className="mb-6 overflow-x-auto">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Top Features by PCA Loading</h3>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Feature
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Squared Sum of Loadings
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contribution (%)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(data.pca_loadings)
                                .filter(([_, loading]) => loading && typeof loading.squared_sum === 'number') // Add filter to ensure squared_sum exists
                                .sort((a, b) => b[1].squared_sum - a[1].squared_sum)
                                .slice(0, 4)
                                .map(([feature, loading], index) => {
                                    // Calculate total sum safely
                                    const totalSum = Object.values(data.pca_loadings)
                                        .filter(l => l && typeof l.squared_sum === 'number')
                                        .reduce((sum, l) => sum + l.squared_sum, 0);

                                    const contribution = totalSum > 0 ? (loading.squared_sum / totalSum) * 100 : 0;

                                    return (
                                        <tr key={feature} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {feature}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {loading.squared_sum.toFixed(4)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <span className="mr-2">{contribution.toFixed(2)}%</span>
                                                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className="bg-blue-600 h-2.5 rounded-full"
                                                            style={{ width: `${Math.min(contribution, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-md">
                    <p>PCA loading data not available. The table cannot be displayed.</p>
                </div>
            )}

            <div className="overflow-auto">
                <svg ref={svgRef} className="mx-auto"></svg>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Interpretation</h3>
                <p className="text-sm text-gray-600">
                    This scatterplot matrix shows relationships between top features identified by PCA analysis.
                    Diagonal cells show feature distributions, while other cells display correlations between features.
                    Data points are colored by cluster assignment ({nClusters} clusters), revealing patterns in how the features relate to each other.
                    Stronger correlations appear as more distinctive patterns in the scatterplots.
                    The table above highlights the 4 most influential features based on their PCA loadings.
                </p>
            </div>
        </div>
    );
};

export default ScatterPlot_Matrix;