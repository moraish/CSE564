import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function Scatterplot({
    data,
    width,
    height,
    margin = { top: 20, right: 30, bottom: 40, left: 40 },
    xAxisLabel = "",
    yAxisLabel = "",
    dotColor = "#4F46E5",
    dotHoverColor = "#818CF8",
    dotRadius = 5,
    dotOpacity = 0.7,
    transitionDuration = 800,
    title = "",
    xKey = "x", // The key for x values in data objects
    yKey = "y", // The key for y values in data objects
    labelKey = "label" // The key for point labels in data objects
}) {
    const svgRef = useRef();
    const containerRef = useRef();
    const [dimensions, setDimensions] = useState({ width: width || 400, height: height || 300 });

    // Update dimensions when container size changes
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || !entries[0]) return;

            const { width, height } = entries[0].contentRect;
            setDimensions({
                width: width,
                height: height
            });
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!data || data.length === 0 || !dimensions.width || !dimensions.height) return;

        // Clear any existing SVG
        d3.select(svgRef.current).selectAll("*").remove();

        // Calculate dimensions
        const innerWidth = dimensions.width - margin.left - margin.right;
        const innerHeight = dimensions.height - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr("width", dimensions.width)
            .attr("height", dimensions.height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X scale
        const x = d3.scaleLinear()
            .domain([d3.min(data, d => d[xKey]) * 0.9, d3.max(data, d => d[xKey]) * 1.1])
            .range([0, innerWidth]);

        // Y scale
        const y = d3.scaleLinear()
            .domain([d3.min(data, d => d[yKey]) * 0.9, d3.max(data, d => d[yKey]) * 1.1])
            .range([innerHeight, 0]);

        // Add X axis
        svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("font-size", "11px");

        // Add Y axis
        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-size", "11px");

        // Add X axis gridlines
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x)
                .tickSize(-innerHeight)
                .tickFormat("")
            )
            .selectAll("line")
            .style("stroke", "#e0e0e0")
            .style("stroke-opacity", 0.7);

        // Add Y axis gridlines
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .tickSize(-innerWidth)
                .tickFormat("")
            )
            .selectAll("line")
            .style("stroke", "#e0e0e0")
            .style("stroke-opacity", 0.7);

        // X axis label
        if (xAxisLabel) {
            svg.append("text")
                .attr("transform", `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 5})`)
                .style("text-anchor", "middle")
                .style("font-size", "12px")
                .text(xAxisLabel);
        }

        // Y axis label
        if (yAxisLabel) {
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -margin.left - 5)
                .attr("x", -(innerHeight / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-size", "12px")
                .text(yAxisLabel);
        }

        // Title
        if (title) {
            svg.append("text")
                .attr("x", innerWidth / 2)
                .attr("y", -margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text(title);
        }

        // Create tooltip
        const tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "1px solid #ddd")
            .style("border-radius", "4px")
            .style("padding", "8px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("transition", "opacity 0.2s");

        // Add data points with animation
        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d[xKey]))
            .attr("cy", d => y(d[yKey]))
            .attr("r", 0)
            .attr("fill", dotColor)
            .style("opacity", dotOpacity)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", dotRadius * 1.5)
                    .attr("fill", dotHoverColor)
                    .style("opacity", 1);

                tooltip
                    .style("opacity", 0.9)
                    .html(`${d[labelKey] || ''}<br/>X: ${d[xKey]}<br/>Y: ${d[yKey]}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", dotRadius)
                    .attr("fill", dotColor)
                    .style("opacity", dotOpacity);

                tooltip.style("opacity", 0);
            })
            .transition()
            .delay((d, i) => i * (transitionDuration / data.length))
            .duration(300)
            .attr("r", dotRadius);

        // Cleanup on unmount
        return () => {
            tooltip.remove();
        };
    }, [data, dimensions, margin, xAxisLabel, yAxisLabel, dotColor, dotHoverColor, dotRadius, dotOpacity, transitionDuration, title, xKey, yKey, labelKey]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center">
            <svg ref={svgRef} width="100%" height="100%" preserveAspectRatio="xMidYMid meet"></svg>
        </div>
    );
}