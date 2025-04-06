import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function PCP({
    data,
    dimensions = [],
    width,
    height,
    margin = { top: 50, right: 50, bottom: 50, left: 50 }, // Increased bottom margin for legend
    lineColor = "#4F46E5",
    lineHoverColor = "#818CF8",
    lineOpacity = 0.5,
    lineHoverOpacity = 0.9,
    lineWidth = 1.5,
    transitionDuration = 800,
    title = "",
    showLabels = true,
    labelKey = "label",
    colorByCategory = true
}) {
    const svgRef = useRef();
    const containerRef = useRef();
    const [containerDimensions, setContainerDimensions] = useState({ width: width || 800, height: height || 400 });

    // Update dimensions when container size changes
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || !entries[0]) return;

            const { width, height } = entries[0].contentRect;
            setContainerDimensions({
                width: width,
                height: height
            });
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!data || data.length === 0 || !dimensions || dimensions.length === 0 ||
            !containerDimensions.width || !containerDimensions.height) return;

        // Clear any existing SVG
        d3.select(svgRef.current).selectAll("*").remove();

        // Calculate dimensions
        const innerWidth = containerDimensions.width - margin.left - margin.right;
        const innerHeight = containerDimensions.height - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr("width", containerDimensions.width)
            .attr("height", containerDimensions.height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create a position scale for each dimension
        const x = d3.scalePoint()
            .domain(dimensions.map(d => d.name))
            .range([0, innerWidth])
            .padding(0.1);

        // Create a scale for each dimension
        const y = {};

        // First create the scales for each dimension
        dimensions.forEach(dimension => {
            // Get the min and max values for this dimension
            const values = data.map(d => d[dimension.name]);

            // Use the provided domain or calculate it
            const domain = dimension.domain || [
                d3.min(values),
                d3.max(values)
            ];

            y[dimension.name] = d3.scaleLinear()
                .domain(domain)
                .range([innerHeight, 0])
                .nice();
        });

        // Create a color scale based on categories if requested
        let colorScale;
        if (colorByCategory) {
            const categories = [...new Set(data.map(d => d.category).filter(Boolean))];
            colorScale = d3.scaleOrdinal()
                .domain(categories)
                .range(d3.schemeCategory10);
        }

        // Create tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid #ddd")
            .style("border-radius", "4px")
            .style("padding", "8px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("z-index", "1000")
            .style("transition", "opacity 0.2s");

        // Now create the axis for each dimension
        dimensions.forEach(dimension => {
            svg.append("g")
                .attr("transform", `translate(${x(dimension.name)},0)`)
                .call(d3.axisLeft(y[dimension.name])
                    // Show only min and max values
                    .tickValues([y[dimension.name].domain()[0], y[dimension.name].domain()[1]])
                    .tickFormat(d => d.toFixed(1)))
                .call(g => {
                    g.select(".domain").attr("stroke-opacity", 0.5);
                    g.selectAll(".tick line").attr("stroke-opacity", 0.5);
                })
                .append("text")
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .attr("fill", "#000")
                .attr("transform", "rotate(-45)") // Rotate text 45 degrees
                .text(dimension.label || dimension.name);
        });

        // Add title - REMOVED "Product Metrics" title
        if (title && title !== "Product Metrics") {
            svg.append("text")
                .attr("x", innerWidth / 2)
                .attr("y", -margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(title);
        }

        // Add legend if coloring by category (positioned below the chart)
        if (colorByCategory) {
            const categories = [...new Set(data.map(d => d.category).filter(Boolean))];

            if (categories.length > 0) {
                const legendItemWidth = 120;
                const legendX = 10;
                const legendY = innerHeight + 25;

                // Create legend background
                svg.append("rect")
                    .attr("x", legendX - 10)
                    .attr("y", legendY - 15)
                    .attr("width", Math.min(categories.length * legendItemWidth, innerWidth * 0.9))
                    .attr("height", 30)
                    .attr("fill", "white")
                    .attr("stroke", "#ccc")
                    .attr("stroke-width", 1)
                    .attr("rx", 4)
                    .attr("opacity", 0.95);

                const legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", `translate(${legendX}, ${legendY})`);

                // Place legend items horizontally
                categories.forEach((category, i) => {
                    const legendItem = legend.append("g")
                        .attr("transform", `translate(${i * legendItemWidth}, 0)`);

                    legendItem.append("line")
                        .attr("x1", 0)
                        .attr("y1", 8)
                        .attr("x2", 15)
                        .attr("y2", 8)
                        .attr("stroke", colorScale(category))
                        .attr("stroke-width", 2);

                    legendItem.append("text")
                        .attr("x", 20)
                        .attr("y", 12)
                        .style("font-size", "12px")
                        .style("font-weight", "500")
                        .text(category);
                });
            }
        }

        // Function to generate path for a data point
        const line = d3.line()
            .defined(d => d !== null)
            .x(d => d.x)
            .y(d => d.y);

        // Draw the paths for each data point
        const paths = svg.selectAll(".data-path")
            .data(data)
            .enter()
            .append("path")
            .attr("class", "data-path")
            .attr("d", d => {
                const points = dimensions.map(dimension => {
                    const value = d[dimension.name];
                    // Handle missing values
                    if (value === undefined || value === null) return null;
                    return {
                        x: x(dimension.name),
                        y: y[dimension.name](value)
                    };
                });
                return line(points.filter(p => p !== null));
            })
            .attr("fill", "none")
            .attr("stroke", d => colorByCategory && d.category ? colorScale(d.category) : lineColor)
            .attr("stroke-width", lineWidth)
            .attr("opacity", 0) // Start with opacity 0 for animation
            .on("mouseover", function (event, d) {
                // Highlight the hovered path
                d3.select(this)
                    .attr("stroke-width", lineWidth * 2)
                    .attr("stroke", d => colorByCategory && d.category ?
                        d3.color(colorScale(d.category)).brighter(0.5) : lineHoverColor)
                    .attr("opacity", lineHoverOpacity)
                    .raise(); // Bring to front

                // Show tooltip with data values
                let tooltipContent = `<strong>${d[labelKey] || ''}</strong>`;
                if (d.category) tooltipContent += `<br/>Category: ${d.category}`;

                dimensions.forEach(dimension => {
                    const value = d[dimension.name];
                    if (value !== undefined && value !== null) {
                        tooltipContent += `<br/>${dimension.label || dimension.name}: ${typeof value === 'number' ? value.toFixed(2) : value}`;
                    }
                });

                tooltip
                    .style("opacity", 0.9)
                    .html(tooltipContent)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                // Restore the original appearance
                d3.select(this)
                    .attr("stroke-width", lineWidth)
                    .attr("stroke", d => colorByCategory && d.category ? colorScale(d.category) : lineColor)
                    .attr("opacity", lineOpacity);

                // Hide tooltip
                tooltip.style("opacity", 0);
            });

        // Animate paths appearing
        paths.transition()
            .duration(transitionDuration)
            .delay((d, i) => i * (transitionDuration / data.length / 2))
            .attr("opacity", lineOpacity);

        // Add labels if enabled
        if (showLabels) {
            // Determine which dimension to use for label placement
            const labelDimension = dimensions[dimensions.length - 1].name;

            svg.selectAll(".data-label")
                .data(data)
                .enter()
                .append("text")
                .attr("class", "data-label")
                .attr("x", x(labelDimension) + 10)
                .attr("y", d => y[labelDimension](d[labelDimension]))
                .attr("dy", "0.35em")
                .style("font-size", "10px")
                .style("fill", d => colorByCategory && d.category ?
                    colorScale(d.category) : "#555")
                .style("opacity", 0)
                .text(d => d[labelKey] || "")
                .transition()
                .delay((d, i) => i * (transitionDuration / data.length / 2) + transitionDuration)
                .duration(300)
                .style("opacity", 0.7);
        }

        // Add brushes for each dimension
        dimensions.forEach(dimension => {
            const dimensionG = svg.append("g")
                .attr("class", "brush")
                .attr("transform", `translate(${x(dimension.name)},0)`);

            const brush = d3.brushY()
                .extent([[-10, 0], [10, innerHeight]])
                .on("start brush end", brushed);

            dimensionG.call(brush);

            function brushed(event) {
                if (!event.selection) {
                    // No selection, reset all paths
                    paths.attr("opacity", lineOpacity);
                    return;
                }

                const [y0, y1] = event.selection;

                // Filter data based on brush selection
                paths.attr("opacity", d => {
                    const value = d[dimension.name];
                    if (value === undefined || value === null) return 0.1;

                    const yVal = y[dimension.name](value);
                    return (y0 <= yVal && yVal <= y1) ? lineOpacity : 0.1;
                });
            }
        });

        // Cleanup on unmount
        return () => {
            tooltip.remove();
        };
    }, [data, dimensions, containerDimensions, margin, lineColor, lineHoverColor,
        lineOpacity, lineHoverOpacity, lineWidth, transitionDuration, title,
        showLabels, labelKey, colorByCategory]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center">
            <svg ref={svgRef} width="100%" height="100%" preserveAspectRatio="xMidYMid meet"></svg>
        </div>
    );
}