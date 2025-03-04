import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Biplot = ({
    pcScores,         // Array of {id, pc1, pc2} objects for each data point
    loadings,         // Array of {feature, pc1, pc2} objects for each original variable
    explainedVariance, // Array of percentages [pc1Variance, pc2Variance]
    width = 800,
    height = 600,
    margin = { top: 40, right: 40, bottom: 60, left: 60 }
}) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!pcScores || !loadings) return;

        // Drawing code will go here
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Clear previous content
        svg.selectAll('*').remove();

        const plot = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        // Scales for data points
        const xScale = d3.scaleLinear()
            .domain(d3.extent(pcScores, d => d.pc1))
            .range([0, plotWidth])
            .nice();

        const yScale = d3.scaleLinear()
            .domain(d3.extent(pcScores, d => d.pc2))
            .range([plotHeight, 0])
            .nice();

        // Draw axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        plot.append('g')
            .attr('transform', `translate(0, ${plotHeight})`)
            .call(xAxis);

        plot.append('g')
            .call(yAxis);

        // Axis labels
        plot.append('text')
            .attr('x', plotWidth / 2)
            .attr('y', plotHeight + margin.bottom - 10)
            .attr('text-anchor', 'middle')
            .text(`PC1 (${explainedVariance[0].toFixed(1)}%)`);

        plot.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -plotHeight / 2)
            .attr('y', -margin.left + 15)
            .attr('text-anchor', 'middle')
            .text(`PC2 (${explainedVariance[1].toFixed(1)}%)`);

        // Draw data points
        plot.selectAll('.point')
            .data(pcScores)
            .enter()
            .append('circle')
            .attr('class', 'point')
            .attr('cx', d => xScale(d.pc1))
            .attr('cy', d => yScale(d.pc2))
            .attr('r', 3)
            .attr('fill', 'steelblue')
            .attr('opacity', 0.7);

        // Scale factor for loading vectors
        const scaleFactor = Math.min(plotWidth, plotHeight) / 2 * 0.8;

        // Draw loading vectors
        const arrows = plot.selectAll('.loading')
            .data(loadings)
            .enter()
            .append('g')
            .attr('class', 'loading');

        // Draw lines for loading vectors
        arrows.append('line')
            .attr('x1', xScale(0))
            .attr('y1', yScale(0))
            .attr('x2', d => xScale(d.pc1 * scaleFactor))
            .attr('y2', d => yScale(d.pc2 * scaleFactor))
            .attr('stroke', 'red')
            .attr('stroke-width', 1);

        // Add feature labels at the end of loading vectors
        arrows.append('text')
            .attr('x', d => xScale(d.pc1 * scaleFactor * 1.1))
            .attr('y', d => yScale(d.pc2 * scaleFactor * 1.1))
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .text(d => d.feature);

    }, [pcScores, loadings, explainedVariance, width, height, margin]);

    return <svg ref={svgRef}></svg>;
};

export default Biplot;