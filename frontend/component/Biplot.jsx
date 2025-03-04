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

        const margin = { top: 50, right: 100, bottom: 50, left: 60 };
        const width = 800 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        // Clear previous SVG
        d3.select(svgRef.current).selectAll('*').remove();

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Create scales
        const xPC = selectedDimensions[0];
        const yPC = selectedDimensions[1];

        const xExtent = d3.extent(pcScores, d => d[xPC]);
        const yExtent = d3.extent(pcScores, d => d[yPC]);

        // Add some padding to extents
        const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
        const yPadding = (yExtent[1] - yExtent[0]) * 0.1;

        const xScale = d3.scaleLinear()
            .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
            .range([height, 0]);

        // Draw axes
        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        svg.append('g')
            .call(d3.axisLeft(yScale));

        // Add axis labels
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + 40)
            .style('text-anchor', 'middle')
            .text(`PC${xPC + 1} (${(variance[xPC] * 100).toFixed(1)}% variance)`);

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -40)
            .style('text-anchor', 'middle')
            .text(`PC${yPC + 1} (${(variance[yPC] * 100).toFixed(1)}% variance)`);

        // Draw data points
        const points = svg.selectAll('circle')
            .data(pcScores)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d[xPC]))
            .attr('cy', d => yScale(d[yPC]))
            .attr('r', 4)
            .style('fill', '#4285F4')
            .style('opacity', 0.7);

        // Add tooltips if point labels are provided
        if (pointLabels) {
            points.append('title')
                .text((d, i) => pointLabels[i]);
        }

        // Draw feature vectors
        const loadingScaleFactor = 5; // Scale factor for loading vectors

        svg.selectAll('.loading')
            .data(loadings)
            .enter()
            .append('line')
            .attr('class', 'loading')
            .attr('x1', xScale(0))
            .attr('y1', yScale(0))
            .attr('x2', d => xScale(d[xPC] * loadingScaleFactor))
            .attr('y2', d => yScale(d[yPC] * loadingScaleFactor))
            .style('stroke', 'red')
            .style('stroke-width', 1);

        // Add feature labels
        svg.selectAll('.feature-label')
            .data(loadings)
            .enter()
            .append('text')
            .attr('class', 'feature-label')
            .attr('x', d => xScale(d[xPC] * loadingScaleFactor * 1.1))
            .attr('y', d => yScale(d[yPC] * loadingScaleFactor * 1.1))
            .text((d, i) => featureNames[i])
            .style('font-size', '10px')
            .style('text-anchor', 'middle');

        // Add origin lines
        svg.append('line')
            .attr('x1', xScale(0))
            .attr('y1', 0)
            .attr('x2', xScale(0))
            .attr('y2', height)
            .style('stroke', '#ccc')
            .style('stroke-dasharray', '4,4');

        svg.append('line')
            .attr('x1', 0)
            .attr('y1', yScale(0))
            .attr('x2', width)
            .attr('y2', yScale(0))
            .style('stroke', '#ccc')
            .style('stroke-dasharray', '4,4');

    }, [pcScores, loadings, featureNames, selectedDimensions, variance]);

    return (
        <div className="biplot-container">
            <svg ref={svgRef}></svg>
        </div>
    );
}