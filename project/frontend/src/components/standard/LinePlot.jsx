import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function LinePlot({
    data,
    width = 400,
    height = 300,
    margin = { top: 20, right: 30, bottom: 30, left: 40 },
    lineColor = "#4F46E5",
    dotColor = "#818CF8",
    xAxisLabel = "",
    yAxisLabel = "",
    transitionDuration = 750,
    title = ""
}) {
    const svgRef = useRef();
    const containerRef = useRef();
    const [dimensions, setDimensions] = useState({ width, height });

    // Add resize observer to make the chart responsive
    useEffect(() => {
        if (!containerRef.current) return;

        // Initial measurement
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({
            width: Math.max(width, 100),
            height: Math.max(height, 100)
        });

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({
                    width: Math.max(width, 100),
                    height: Math.max(height, 100)
                });
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!data || data.length === 0) return;

        // Clear any existing SVG
        d3.select(svgRef.current).selectAll("*").remove();

        const currentWidth = dimensions.width;
        const currentHeight = dimensions.height;

        // Calculate dimensions
        const innerWidth = currentWidth - margin.left - margin.right;
        const innerHeight = currentHeight - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr("width", currentWidth)
            .attr("height", currentHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X scale
        const x = d3.scalePoint()
            .domain(data.map(d => d.label))
            .range([0, innerWidth]);

        // Y scale
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value) * 1.1])
            .range([innerHeight, 0]);

        // Line generator
        const line = d3.line()
            .x(d => x(d.label))
            .y(d => y(d.value))
            .curve(d3.curveMonotoneX);

        // Add X axis
        svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", "10px"); // Smaller font for better fit

        // Add Y axis
        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-size", "10px"); // Smaller font for better fit

        // X axis label
        if (xAxisLabel) {
            svg.append("text")
                .attr("transform", `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 5})`)
                .style("text-anchor", "middle")
                .style("font-size", "10px") // Smaller label
                .text(xAxisLabel);
        }

        // Y axis label
        if (yAxisLabel) {
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -margin.left + 12) // Move closer to the axis
                .attr("x", -(innerHeight / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-size", "10px") // Smaller label
                .text(yAxisLabel);
        }

        // Title
        if (title) {
            svg.append("text")
                .attr("x", innerWidth / 2)
                .attr("y", -margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "12px") // Smaller title
                .text(title);
        }

        // Add the line with animation
        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", lineColor)
            .attr("stroke-width", 2)
            .attr("d", line);

        // Animate the line
        const pathLength = path.node().getTotalLength();
        path.attr("stroke-dasharray", pathLength)
            .attr("stroke-dashoffset", pathLength)
            .transition()
            .duration(transitionDuration)
            .attr("stroke-dashoffset", 0);

        // Add the dots with animation
        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.label))
            .attr("cy", d => y(d.value))
            .attr("r", 0)
            .attr("fill", dotColor)
            .transition()
            .delay((d, i) => i * (transitionDuration / data.length))
            .duration(300)
            .attr("r", 4); // Smaller dots

        // Add tooltip functionality
        const tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "1px solid #ddd")
            .style("border-radius", "4px")
            .style("padding", "6px")
            .style("font-size", "10px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("z-index", "1000")
            .style("transition", "opacity 0.2s");

        svg.selectAll(".dot")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 6);

                tooltip
                    .style("opacity", 0.9)
                    .html(`${d.label}: ${d.value}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 4);

                tooltip.style("opacity", 0);
            });

        // Cleanup on unmount
        return () => {
            tooltip.remove();
        };
    }, [data, dimensions, margin, lineColor, dotColor, xAxisLabel, yAxisLabel, transitionDuration, title]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <svg ref={svgRef} width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}></svg>
        </div>
    );
}