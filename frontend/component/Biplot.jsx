import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function BiPlot({
    pcScores, // Array of projected data points [x, y] in the PC space
    loadings, // Array of feature loadings for each PC
    featureNames, // Array of original feature names
    variance, // Array of variance explained by each PC
    selectedDimensions, // Array of selected PC indices (usually [0, 1])
    originalData, // Optional: original data for tooltips
    pointLabels, // Optional: labels for each data point
}) {
    const svgRef = useRef();

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
            .attr("fill", "url(#biplot-bg-gradient)");

        // Create scales
        const xPC = selectedDimensions[0];
        const yPC = selectedDimensions[1];

        const xExtent = d3.extent(pcScores, d => d[xPC]);
        const yExtent = d3.extent(pcScores, d => d[yPC]);

        // Add some padding to extents
        const xPadding = (xExtent[1] - xExtent[0]) * 0.15;
        const yPadding = (yExtent[1] - yExtent[0]) * 0.15;

        const xScale = d3.scaleLinear()
            .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
            .range([height, 0]);

        // Add grid lines
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0, ${height})`)
            .call(
                d3.axisBottom(xScale)
                    .ticks(10)
                    .tickSize(-height)
                    .tickFormat("")
            )
            .attr("stroke-opacity", 0.1);

        svg.append("g")
            .attr("class", "grid")
            .call(
                d3.axisLeft(yScale)
                    .ticks(10)
                    .tickSize(-width)
                    .tickFormat("")
            )
            .attr("stroke-opacity", 0.1);

        // Draw axes with better styling
        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .attr('class', 'x-axis')
            .call(d3.axisBottom(xScale).ticks(10))
            .selectAll('text')
            .style('font-size', '12px');

        svg.append('g')
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

        // Add title with background
        const titleG = svg.append("g")
            .attr("class", "title-container");

        titleG.append("rect")
            .attr("x", width / 2 - 150)
            .attr("y", -margin.top + 15)
            .attr("width", 300)
            .attr("height", 40)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("fill", "#264653")
            .attr("opacity", 0.8);

        titleG.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top + 40)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .text("PCA Biplot");

        // Draw origin lines with better styling
        svg.append('line')
            .attr('x1', xScale(0))
            .attr('y1', 0)
            .attr('x2', xScale(0))
            .attr('y2', height)
            .style('stroke', '#aaa')
            .style('stroke-width', 1)
            .style('stroke-dasharray', '4,4');

        svg.append('line')
            .attr('x1', 0)
            .attr('y1', yScale(0))
            .attr('x2', width)
            .attr('y2', yScale(0))
            .style('stroke', '#aaa')
            .style('stroke-width', 1)
            .style('stroke-dasharray', '4,4');

        // Draw data points with animation and improved styling
        const points = svg.selectAll('circle')
            .data(pcScores)
            .enter()
            .append('circle')
            .attr('cx', xScale(0))
            .attr('cy', yScale(0))
            .attr('r', 0)
            .style('fill', '#4285F4')
            .style('stroke', '#fff')
            .style('stroke-width', 1)
            .style('opacity', 0.7);

        // Animate points
        points.transition()
            .duration(800)
            .attr('cx', d => xScale(d[xPC]))
            .attr('cy', d => yScale(d[yPC]))
            .attr('r', 5);

        // Add hover effects
        points.on('mouseover', function (event, d) {
            const i = pcScores.indexOf(d);
            d3.select(this)
                .attr('r', 8)
                .style('fill', '#e76f51')
                .style('opacity', 1);

            // Add tooltip
            if (pointLabels) {
                svg.append('text')
                    .attr('class', 'point-tooltip')
                    .attr('x', xScale(d[xPC]))
                    .attr('y', yScale(d[yPC]) - 10)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '12px')
                    .style('font-weight', 'bold')
                    .text(pointLabels[i]);
            }
        })
            .on('mouseout', function () {
                d3.select(this)
                    .attr('r', 5)
                    .style('fill', '#4285F4')
                    .style('opacity', 0.7);

                svg.selectAll('.point-tooltip').remove();
            });

        // Add tooltips if point labels are provided (as title attribute)
        if (pointLabels) {
            points.append('title')
                .text((d, i) => pointLabels[i]);
        }

        // Draw feature vectors with better styling and animation
        const loadingScaleFactor = 5; // Scale factor for loading vectors

        const featureVectors = svg.selectAll('.loading')
            .data(loadings)
            .enter()
            .append('line')
            .attr('class', 'loading')
            .attr('x1', xScale(0))
            .attr('y1', yScale(0))
            .attr('x2', xScale(0))
            .attr('y2', yScale(0))
            .style('stroke', '#D62828')  // Changed color to be more visible
            .style('stroke-width', 2);

        // Animate feature vectors
        featureVectors.transition()
            .duration(1000)
            .attr('x2', d => xScale(d[xPC] * loadingScaleFactor))
            .attr('y2', d => yScale(d[yPC] * loadingScaleFactor));

        // Add arrow heads to feature vectors
        featureVectors.each(function (d, i) {
            const x2 = d[xPC] * loadingScaleFactor;
            const y2 = d[yPC] * loadingScaleFactor;
            const angle = Math.atan2(y2, x2);

            svg.append('path')
                .attr('transform', `translate(${xScale(x2)},${yScale(y2)})`)
                .attr('d', `M0,0 L-8,4 L-8,-4 Z`)
                .attr('fill', '#D62828')
                .style('opacity', 0)
                .attr('transform', `translate(${xScale(0)},${yScale(0)}) rotate(0)`)
                .transition()
                .duration(1000)
                .attr('transform', `translate(${xScale(x2)},${yScale(y2)}) rotate(${angle * 180 / Math.PI + 90})`)
                .style('opacity', 1);
        });

        // Add feature labels with better styling and animation
        const featureLabels = svg.selectAll('.feature-label')
            .data(loadings)
            .enter()
            .append('text')
            .attr('class', 'feature-label')
            .attr('x', xScale(0))
            .attr('y', yScale(0))
            .text((d, i) => featureNames[i])
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('text-anchor', 'middle')
            .style('opacity', 0);

        // Animate feature labels
        featureLabels.transition()
            .duration(1200)
            .delay(300)
            .attr('x', d => xScale(d[xPC] * loadingScaleFactor * 1.2))
            .attr('y', d => yScale(d[yPC] * loadingScaleFactor * 1.2))
            .style('opacity', 1);

        // Add hover effects for feature labels
        featureLabels.on('mouseover', function () {
            d3.select(this)
                .style('font-size', '14px')
                .style('fill', '#D62828');
        })
            .on('mouseout', function () {
                d3.select(this)
                    .style('font-size', '12px')
                    .style('fill', '#000');
            });

        // Add legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width + 15}, 20)`);

        legend.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 5)
            .style('fill', '#4285F4')
            .style('stroke', '#fff');

        legend.append('text')
            .attr('x', 10)
            .attr('y', 5)
            .text('Data points')
            .style('font-size', '12px');

        legend.append('line')
            .attr('x1', -5)
            .attr('y1', 25)
            .attr('x2', 5)
            .attr('y2', 25)
            .style('stroke', '#D62828')
            .style('stroke-width', 2);

        legend.append('text')
            .attr('x', 10)
            .attr('y', 30)
            .text('Feature vectors')
            .style('font-size', '12px');

    }, [pcScores, loadings, featureNames, selectedDimensions, variance, pointLabels]);

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
                    Biplot of PC{selectedDimensions[0] + 1} and PC{selectedDimensions[1] + 1}
                </p>
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
                    <strong>Total variance explained:</strong> {((variance[selectedDimensions[0]] + variance[selectedDimensions[1]]) * 100).toFixed(2)}%
                </p>
                <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#666" }}>
                    PC{selectedDimensions[0] + 1}: {(variance[selectedDimensions[0]] * 100).toFixed(2)}% •
                    PC{selectedDimensions[1] + 1}: {(variance[selectedDimensions[1]] * 100).toFixed(2)}%
                </p>
            </div>
        </div>
    );
}