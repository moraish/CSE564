import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function BiPlot({
    pcScores, // Array of projected data points [x, y] in the PC space
    loadings, // Array of feature loadings for each PC
    featureNames, // Array of original feature names
    variance, // Array of variance explained by each PC
    dimensions, // [x, y] dimensions from parent
    setDimensions, // setter from parent
    handleDimensionChange, // handler function from parent
    originalData, // Optional: original data for tooltips
    pointLabels, // Optional: labels for each data point
}) {
    const svgRef = useRef();

    // Calculate number of available PCs
    const numPCs = pcScores && pcScores[0] ? pcScores[0].length : 0;

    useEffect(() => {
        if (!pcScores || !loadings) return;

        const margin = { top: 60, right: 100, bottom: 70, left: 80 };
        const width = 800 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;


        // Clear previous SVG
        d3.select(svgRef.current).selectAll('*').remove();

        // Create SVG with responsive container
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
            .attr("id", "biplot-bg-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#f8f9fa")
            .attr("stop-opacity", 0.6);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#e9ecef")
            .attr("stop-opacity", 0.6);

        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "url(#biplot-bg-gradient)");

        // Create scales
        const xPC = dimensions[0];
        const yPC = dimensions[1];

        const xExtent = d3.extent(pcScores, d => d[xPC]);
        const yExtent = d3.extent(pcScores, d => d[yPC]);

        // Add some padding to extents
        const xPadding = (xExtent[1] - xExtent[0]) * 0.15;
        const yPadding = (yExtent[1] - yExtent[0]) * 0.15;

        // Ensure scales include zero for proper quadrant display
        let xMin = Math.min(xExtent[0] - xPadding, 0);
        let xMax = Math.max(xExtent[1] + xPadding, 0);
        let yMin = Math.min(yExtent[0] - yPadding, 0);
        let yMax = Math.max(yExtent[1] + yPadding, 0);

        const xScale = d3.scaleLinear()
            .domain([xMin, xMax])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([height, 0]);

        // Add grid lines for better quadrant visibility
        svg.append("g")
            .attr("class", "grid")
            .attr("opacity", 0.2)
            .call(d3.axisBottom(xScale)
                .tickSize(height)
                .tickFormat("")
                .ticks(10)
            );

        svg.append("g")
            .attr("class", "grid")
            .attr("opacity", 0.2)
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat("")
                .ticks(10)
            );

        // Add quadrant lines (crossing at origin)
        svg.append("line")
            .attr("x1", 0)
            .attr("y1", yScale(0))
            .attr("x2", width)
            .attr("y2", yScale(0))
            .attr("stroke", "#343a40")
            .attr("stroke-width", 1.5);

        svg.append("line")
            .attr("x1", xScale(0))
            .attr("y1", 0)
            .attr("x2", xScale(0))
            .attr("y2", height)
            .attr("stroke", "#343a40")
            .attr("stroke-width", 1.5);

        // Draw quadrant labels
        const quadrantLabels = [
            { text: "Quadrant I", x: width * 0.75, y: height * 0.25 },
            { text: "Quadrant II", x: width * 0.25, y: height * 0.25 },
            { text: "Quadrant III", x: width * 0.25, y: height * 0.75 },
            { text: "Quadrant IV", x: width * 0.75, y: height * 0.75 }
        ];

        svg.selectAll(".quadrant-label")
            .data(quadrantLabels)
            .enter()
            .append("text")
            .attr("class", "quadrant-label")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("text-anchor", "middle")
            .attr("fill", "#6c757d")
            .attr("opacity", 0.6)
            .style("font-size", "14px")
            .style("font-style", "italic")
            .text(d => d.text);

        // Draw axes with better styling
        svg.append('g')
            .attr('transform', `translate(0, ${yScale(0)})`)
            .attr('class', 'x-axis')
            .call(d3.axisBottom(xScale).ticks(10))
            .selectAll('text')
            .style('font-size', '12px');

        svg.append('g')
            .attr('transform', `translate(${xScale(0)}, 0)`)
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale).ticks(10))
            .selectAll('text')
            .style('font-size', '12px');

        // Add axis labels with better styling
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + 50)
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text(`PC${xPC + 1} (${(variance[xPC] * 100).toFixed(1)}% variance)`);

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -55)
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text(`PC${yPC + 1} (${(variance[yPC] * 100).toFixed(1)}% variance)`);

        // Plot the PC scores (data points)
        const pointsGroup = svg.append('g')
            .attr('class', 'data-points');

        // Create tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "1px solid #ddd")
            .style("border-radius", "4px")
            .style("padding", "8px")
            .style("font-size", "12px")
            .style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Add data points
        pointsGroup.selectAll("circle")
            .data(pcScores)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d[xPC]))
            .attr("cy", d => yScale(d[yPC]))
            .attr("r", 5)
            .attr("fill", "#3498db")
            .attr("stroke", "#2980b9")
            .attr("stroke-width", 1)
            .attr("opacity", 0.7)
            .on("mouseover", function (event, d, i) {
                d3.select(this)
                    .attr("r", 7)
                    .attr("opacity", 1);

                // Show tooltip
                tooltip.transition().duration(200).style("opacity", 0.9);

                let tooltipContent = `PC${xPC + 1}: ${d[xPC].toFixed(3)}<br>PC${yPC + 1}: ${d[yPC].toFixed(3)}`;

                // Add label if available
                if (pointLabels && pointLabels[i]) {
                    tooltipContent = `<strong>${pointLabels[i]}</strong><br>${tooltipContent}`;
                }

                tooltip.html(tooltipContent)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .attr("r", 5)
                    .attr("opacity", 0.7);

                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Add feature vector lines (loadings)
        if (loadings && featureNames) {
            // Create better scaling for the feature vectors
            // First, find the maximum loading value to normalize
            const maxLoadingMagnitude = Math.max(
                ...loadings.map(d => Math.sqrt(Math.pow(d[xPC], 2) + Math.pow(d[yPC], 2)))
            );

            // Calculate the maximum allowed vector length in data units
            // This ensures vectors stay within the visible plot area
            const maxAllowedX = 0.8 * Math.min(Math.abs(xMin), Math.abs(xMax));
            const maxAllowedY = 0.8 * Math.min(Math.abs(yMin), Math.abs(yMax));

            // Find the maximum scale factor that keeps all vectors within bounds
            let loadingScale = Infinity;
            loadings.forEach(d => {
                // Calculate what scale would make this vector reach the boundary
                const xScale = d[xPC] !== 0 ? maxAllowedX / Math.abs(d[xPC]) : Infinity;
                const yScale = d[yPC] !== 0 ? maxAllowedY / Math.abs(d[yPC]) : Infinity;

                // Take the minimum scale that still fits this vector
                const vectorMaxScale = Math.min(xScale, yScale);

                // Update global scale to ensure all vectors fit
                loadingScale = Math.min(loadingScale, vectorMaxScale);
            });

            // Apply a safety factor to ensure vectors stay comfortably within bounds
            loadingScale *= 0.85;

            const loadingsGroup = svg.append('g')
                .attr('class', 'loadings');

            // Draw arrow heads for vectors using custom markers
            const arrowSize = 5;
            const defs = svg.append("defs");

            defs.append("marker")
                .attr("id", "arrow")
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 8)
                .attr("refY", 0)
                .attr("markerWidth", arrowSize)
                .attr("markerHeight", arrowSize)
                .attr("orient", "auto")
                .append("path")
                .attr("fill", "#e74c3c")
                .attr("d", "M0,-5L10,0L0,5");

            // Draw the feature vector lines with arrows
            loadingsGroup.selectAll('line')
                .data(loadings)
                .enter()
                .append('line')
                .attr('x1', xScale(0))
                .attr('y1', yScale(0))
                .attr('x2', d => xScale(d[xPC] * loadingScale))
                .attr('y2', d => yScale(d[yPC] * loadingScale))
                .attr('stroke', '#e74c3c')
                .attr('stroke-width', 1.5)
                .attr('opacity', 0.8)
                .attr("marker-end", "url(#arrow)");

            // Add tooltip for loadings to show exact values
            loadingsGroup.selectAll('circle')
                .data(loadings)
                .enter()
                .append('circle')
                .attr('cx', d => xScale(d[xPC] * loadingScale * 0.8))
                .attr('cy', d => yScale(d[yPC] * loadingScale * 0.8))
                .attr('r', 3)
                .attr('fill', 'transparent')
                .attr('stroke', 'none')
                .on("mouseover", function (event, d, i) {
                    tooltip.transition().duration(200).style("opacity", 0.9);

                    tooltip.html(`<strong>${featureNames[i]}</strong><br>` +
                        `Loading on PC${xPC + 1}: ${d[xPC].toFixed(3)}<br>` +
                        `Loading on PC${yPC + 1}: ${d[yPC].toFixed(3)}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function () {
                    tooltip.transition().duration(500).style("opacity", 0);
                });

            // Add feature names at the end of loading vectors with better positioning
            loadingsGroup.selectAll('.loading-text')
                .data(loadings)
                .enter()
                .append('text')
                .attr('class', 'loading-text')
                .attr('x', d => {
                    // Position text at the end of the vector with some offset
                    const scaledX = d[xPC] * loadingScale;
                    return xScale(scaledX * 1.1); // 10% beyond the arrow
                })
                .attr('y', d => {
                    // Position text at the end of the vector with some offset
                    const scaledY = d[yPC] * loadingScale;
                    return yScale(scaledY * 1.1); // 10% beyond the arrow
                })
                .attr('text-anchor', d => d[xPC] > 0 ? 'start' : 'end')
                .attr('alignment-baseline', d => d[yPC] > 0 ? 'auto' : 'hanging')
                .attr('font-size', '10px')
                .attr('font-weight', 'bold')
                .attr('fill', '#c0392b')
                .text((d, i) => featureNames[i])
                .style('filter', 'drop-shadow(0px 0px 2px rgba(255,255,255,0.8))');

            // Add a legend explaining the vectors
            svg.append('text')
                .attr('x', width - 20)
                .attr('y', 20)
                .attr('text-anchor', 'end')
                .style('font-size', '12px')
                .style('font-style', 'italic')
                .text('● Data points    → Feature loadings');
        }

    }, [pcScores, loadings, featureNames, dimensions, variance, pointLabels]);

    return (
        <div className="biplot-container" style={{
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            maxWidth: "850px",
            margin: "0 auto",
            padding: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: "0 0 5px 0", color: "#264653" }}>Principal Component Analysis</h2>
                <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                    Biplot of PC{dimensions[0] + 1} and PC{dimensions[1] + 1}
                </p>

                {/* PC Selection Controls */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "20px",
                    marginTop: "15px",
                    backgroundColor: "#f1f3f5",
                    padding: "10px",
                    borderRadius: "6px",
                    maxWidth: "500px",
                    margin: "15px auto"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label htmlFor="x-pc" style={{ fontWeight: "bold", fontSize: "14px" }}>X-axis:</label>
                        <select
                            id="x-pc"
                            value={dimensions[0]}
                            onChange={(e) => handleDimensionChange('x', e.target.value)}
                            style={{
                                padding: "5px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                backgroundColor: "#fff"
                            }}
                        >
                            {[...Array(numPCs)].map((_, i) => (
                                <option key={`x-${i}`} value={i}>
                                    PC{i + 1} ({(variance[i] * 100).toFixed(1)}%)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label htmlFor="y-pc" style={{ fontWeight: "bold", fontSize: "14px" }}>Y-axis:</label>
                        <select
                            id="y-pc"
                            value={dimensions[1]}
                            onChange={(e) => handleDimensionChange('y', e.target.value)}
                            style={{
                                padding: "5px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                backgroundColor: "#fff"
                            }}
                        >
                            {[...Array(numPCs)].map((_, i) => (
                                <option key={`y-${i}`} value={i}>
                                    PC{i + 1} ({(variance[i] * 100).toFixed(1)}%)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ width: "100%", textAlign: "center" }}>
                <svg ref={svgRef} style={{ maxWidth: "100%" }} />
            </div>

            <div style={{
                marginTop: "20px",
                textAlign: "center",
                backgroundColor: "#f8f9fa",
                padding: "15px",
                borderRadius: "6px",
                fontSize: "14px"
            }}>
                <p>
                    <strong>Total variance explained:</strong> {((variance[dimensions[0]] + variance[dimensions[1]]) * 100).toFixed(2)}%
                </p>
                <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#666" }}>
                    PC{dimensions[0] + 1}: {(variance[dimensions[0]] * 100).toFixed(2)}% •
                    PC{dimensions[1] + 1}: {(variance[dimensions[1]] * 100).toFixed(2)}%
                </p>
            </div>
        </div>
    );
}