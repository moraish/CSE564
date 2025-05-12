import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function LineBarChart({
    data = [],
    width = 700, // Adjusted default width for dual axes
    height = 400,
    margin = { top: 30, right: 70, bottom: 70, left: 70 }, // Adjusted margins for dual axes labels
    xAxisLabel = 'X Axis',
    yBarAxisLabel = 'Bar Y Axis',
    yLineAxisLabel = 'Line Y Axis',
    barColor = '#5B8FF9', // Updated: A calm, professional blue
    lineColor = '#F6BD16', // Updated: A warm, contrasting amber/orange
    hoverColor = '#8DC8FF', // Updated: A lighter blue for bar hover
    title = '',
    transitionDuration = 500,
}) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Add resize observer to update dimensions when container size changes
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!data.length || dimensions.width === 0 || dimensions.height === 0) return;

        const chartWidth = dimensions.width;
        const chartHeight = dimensions.height;

        const innerWidth = chartWidth - margin.left - margin.right;
        const innerHeight = chartHeight - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const g = svg
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        if (title) {
            svg
                .append('text')
                .attr('x', chartWidth / 2)
                .attr('y', margin.top / 2 + 5) // Adjusted y for title
                .attr('text-anchor', 'middle')
                .style('font-size', '18px')
                .style('font-weight', 'bold')
                .text(title);
        }

        // Create scales
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.label))
            .range([0, innerWidth])
            .padding(0.2);

        const yBarScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.barValue) * 1.1 || 10]) // Ensure domain is at least 10
            .range([innerHeight, 0]);

        const yLineScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.lineValue) * 1.1 || 10]) // Ensure domain is at least 10
            .range([innerHeight, 0]);

        // Draw X axis
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');


        // Add X axis label
        g.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + margin.bottom - 10)
            .attr('text-anchor', 'middle')
            .text(xAxisLabel);

        // Draw Y Bar axis (Left)
        g.append('g')
            .call(d3.axisLeft(yBarScale));

        // Add Y Bar axis label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -margin.left + 20)
            .attr('text-anchor', 'middle')
            .text(yBarAxisLabel);

        // Draw Y Line axis (Right)
        g.append('g')
            .attr('transform', `translate(${innerWidth},0)`)
            .call(d3.axisRight(yLineScale));

        // Add Y Line axis label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', innerWidth + margin.right - 20)
            .attr('text-anchor', 'middle')
            .text(yLineAxisLabel);

        // Draw bars
        const bars = g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.label))
            .attr('width', xScale.bandwidth())
            .attr('y', innerHeight) // Start from bottom for animation
            .attr('height', 0)      // Start with height 0 for animation
            .attr('fill', barColor)
            .on('mouseenter', function (event, d) {
                d3.select(this).attr('fill', hoverColor);
                // Show tooltip or value for bar
                // const [mx, my] = d3.pointer(event, g.node()); // mx, my not used, can be removed if not needed for other logic
                g.append('text')
                    .attr('class', 'hover-value-bar')
                    .attr('x', xScale(d.label) + xScale.bandwidth() / 2)
                    .attr('y', yBarScale(d.barValue) - 5)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '12px')
                    .style('font-weight', 'bold')
                    .text(`Count: ${d.barValue}`);
            })
            .on('mouseleave', function () {
                d3.select(this).attr('fill', barColor);
                g.selectAll('.hover-value-bar').remove();
            });

        bars.transition()
            .duration(transitionDuration)
            .attr('y', d => yBarScale(d.barValue))
            .attr('height', d => innerHeight - yBarScale(d.barValue));

        // Define the line
        const line = d3.line()
            .x(d => xScale(d.label) + xScale.bandwidth() / 2) // Center line in the bar
            .y(d => yLineScale(d.lineValue));

        // Draw the line path
        const linePath = g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', lineColor)
            .attr('stroke-width', 2)
            .attr('d', line);

        // Animate line drawing (optional)
        if (linePath.node() && typeof linePath.node().getTotalLength === 'function') {
            const totalLength = linePath.node().getTotalLength();
            linePath
                .attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(transitionDuration)
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);
        }


        // Add points to the line
        g.selectAll('.line-point')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'line-point')
            .attr('cx', d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr('cy', innerHeight) // Start from bottom for animation
            .attr('r', 4)
            .attr('fill', lineColor)
            .on('mouseenter', function (event, d) {
                d3.select(this).attr('r', 6);
                // Show tooltip or value for line point
                g.append('text')
                    .attr('class', 'hover-value-line')
                    .attr('x', xScale(d.label) + xScale.bandwidth() / 2)
                    .attr('y', yLineScale(d.lineValue) - 10)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '12px')
                    .style('font-weight', 'bold')
                    .text(`Price: ${d.lineValue.toFixed(2)}`);
            })
            .on('mouseleave', function () {
                d3.select(this).attr('r', 4);
                g.selectAll('.hover-value-line').remove();
            });

        g.selectAll('.line-point')
            .transition()
            .duration(transitionDuration)
            .attr('cy', d => yLineScale(d.lineValue));


    }, [data, margin, xAxisLabel, yBarAxisLabel, yLineAxisLabel, barColor, lineColor, hoverColor, title, transitionDuration, dimensions]);

    return (
        <div ref={containerRef} className="line-bar-chart-container" style={{ width: '100%', height: '100%' }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{ overflow: 'visible' }} // Important for labels outside chart area
            />
        </div>
    );
}