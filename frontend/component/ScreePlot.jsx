import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';


export default function ScreePlot({ eigenValues, selectedDimension, setSelectedDimension }) {
    // const [selectedDimension, setSelectedDimension] = useState(2);
    const svgRef = useRef();
    // Increased dimensions for better visualization
    const width = 700;
    const height = 500;
    const margin = { top: 50, right: 80, bottom: 80, left: 80 };

    useEffect(() => {
        if (!svgRef.current) return;

        // Clear previous content
        d3.select(svgRef.current).selectAll("*").remove();

        // Calculate explained variance
        const totalVariance = eigenValues.reduce((a, b) => a + b, 0);
        const explainedVariance = eigenValues.map(val => val / totalVariance);
        const cumulativeVariance = explainedVariance.reduce(
            (acc, val, i) => [...acc, (i > 0 ? acc[i - 1] : 0) + val],
            []
        );

        // Filter out near-zero eigenvalues for better visualization
        const significantIndices = eigenValues.map((val, idx) =>
            val > 0.001 ? idx : null).filter(idx => idx !== null);
        const lastSignificantIndex = Math.max(...significantIndices);

        // Create the SVG with responsive container
        const svg = d3.select(svgRef.current)
            .attr("width", "100%")
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Add gradient background for a polished look
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "scree-bg-gradient")
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
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "url(#scree-bg-gradient)");

        // Define scales with appropriate domains
        const xScale = d3.scaleLinear()
            .domain([0, lastSignificantIndex + 1])
            .range([margin.left, width - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([0, Math.max(...eigenValues) * 1.1])
            .range([height - margin.bottom, margin.top]);

        const y2Scale = d3.scaleLinear()
            .domain([0, 1])
            .range([height - margin.bottom, margin.top]);

        // Create x-axis with better spacing
        const xAxis = d3.axisBottom(xScale)
            .ticks(Math.min(lastSignificantIndex + 1, 13))
            .tickFormat(d => `PC${d + 1}`);

        const yAxis = d3.axisLeft(yScale)
            .ticks(10)
            .tickFormat(d3.format(".1f"));

        const y2Axis = d3.axisRight(y2Scale)
            .ticks(10)
            .tickFormat(d3.format(".0%"));

        // Grid lines for better readability
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(
                d3.axisBottom(xScale)
                    .ticks(Math.min(lastSignificantIndex + 1, 13))
                    .tickSize(-(height - margin.top - margin.bottom))
                    .tickFormat("")
            )
            .attr("stroke-opacity", 0.1);

        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(
                d3.axisLeft(yScale)
                    .ticks(10)
                    .tickSize(-(width - margin.left - margin.right))
                    .tickFormat("")
            )
            .attr("stroke-opacity", 0.1);

        // Apply axes with styling
        svg.append("g")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .attr("class", "x-axis")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)")
            .style("font-size", "12px");

        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .attr("class", "y-axis")
            .call(yAxis)
            .selectAll("text")
            .style("font-size", "12px");

        svg.append("g")
            .attr("transform", `translate(${width - margin.right}, 0)`)
            .attr("class", "y2-axis")
            .call(y2Axis)
            .selectAll("text")
            .style("font-size", "12px");

        // Enhanced bar styling
        const barWidth = Math.min(30, (width - margin.left - margin.right) / (lastSignificantIndex + 2) - 5);

        const barGroup = svg.append("g")
            .attr("class", "bars");

        // Add bars with animation
        barGroup.selectAll(".bar")
            .data(eigenValues.slice(0, lastSignificantIndex + 1))
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", (d, i) => xScale(i) - barWidth / 2)
            .attr("y", height - margin.bottom)
            .attr("width", barWidth)
            .attr("height", 0)
            .attr("rx", 2) // Rounded corners
            .attr("ry", 2)
            .attr("fill", (d, i) => i < selectedDimension ? "#2a9d8f" : "#e9c46a")
            .attr("stroke", "#495057")
            .attr("stroke-width", 0.5)
            .attr("stroke-opacity", 0.5)
            .transition()
            .duration(800)
            .attr("y", d => yScale(d))
            .attr("height", d => height - margin.bottom - yScale(d));

        // Add hover and click effects after transition
        barGroup.selectAll(".bar")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("fill", "#e76f51")
                    .attr("stroke-width", 1);

                const i = eigenValues.indexOf(d);
                const percent = (d / totalVariance * 100).toFixed(1);

                // Add tooltip
                svg.append("text")
                    .attr("class", "bar-tooltip")
                    .attr("x", xScale(i))
                    .attr("y", yScale(d) - 10)
                    .attr("text-anchor", "middle")
                    .style("font-size", "12px")
                    .style("font-weight", "bold")
                    .text(`${percent}%`);
            })
            .on("mouseout", function (event, d) {
                const i = eigenValues.indexOf(d);
                d3.select(this)
                    .attr("fill", i < selectedDimension ? "#2a9d8f" : "#e9c46a")
                    .attr("stroke-width", 0.5);

                svg.selectAll(".bar-tooltip").remove();
            })
            .on("click", function (event, d) {
                const i = eigenValues.indexOf(d);
                setSelectedDimension(i + 1);
            });

        // Add cumulative variance line with animation
        const line = d3.line()
            .x((d, i) => xScale(i))
            .y(d => y2Scale(d))
            .curve(d3.curveMonotoneX); // Smoother curve

        const linePath = svg.append("path")
            .datum(cumulativeVariance.slice(0, lastSignificantIndex + 1))
            .attr("fill", "none")
            .attr("stroke", "#264653")
            .attr("stroke-width", 3)
            .attr("d", line);

        // Animate line path
        const pathLength = linePath.node().getTotalLength();
        linePath
            .attr("stroke-dasharray", pathLength)
            .attr("stroke-dashoffset", pathLength)
            .transition()
            .duration(1500)
            .attr("stroke-dashoffset", 0);

        // Add dots with delay to match line animation
        svg.selectAll(".dot")
            .data(cumulativeVariance.slice(0, lastSignificantIndex + 1))
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", (d, i) => xScale(i))
            .attr("cy", d => y2Scale(d))
            .attr("r", 0)
            .attr("fill", "#264653")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .transition()
            .delay((d, i) => i * 150)
            .duration(400)
            .attr("r", 5);

        // Add dot hover effects after transition
        svg.selectAll(".dot")
            .on("mouseover", function (event, d) {
                const i = cumulativeVariance.indexOf(d);
                const percent = (d * 100).toFixed(1);

                d3.select(this)
                    .attr("r", 7)
                    .attr("fill", "#e76f51");

                // Add tooltip
                svg.append("text")
                    .attr("class", "dot-tooltip")
                    .attr("x", xScale(i))
                    .attr("y", y2Scale(d) - 10)
                    .attr("text-anchor", "middle")
                    .style("font-size", "12px")
                    .style("font-weight", "bold")
                    .text(`${percent}%`);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .attr("r", 5)
                    .attr("fill", "#264653");

                svg.selectAll(".dot-tooltip").remove();
            });

        // Add selection line with animation
        svg.append("line")
            .attr("class", "selection-line")
            .attr("x1", xScale(selectedDimension - 1))
            .attr("y1", height - margin.bottom)
            .attr("x2", xScale(selectedDimension - 1))
            .attr("y2", height - margin.bottom)
            .attr("stroke", "#e63946")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .transition()
            .duration(800)
            .attr("y1", margin.top);

        // Enhanced axis labels with stronger styling
        svg.append("text")
            .attr("transform", `translate(${width / 2}, ${height - margin.bottom / 3})`)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Principal Components");

        svg.append("text")
            .attr("transform", `rotate(-90) translate(${-(height - margin.bottom + margin.top) / 2}, ${margin.left / 3})`)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Eigenvalue");

        svg.append("text")
            .attr("transform", `rotate(-90) translate(${-(height - margin.bottom + margin.top) / 2}, ${width - margin.right / 3})`)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Cumulative Explained Variance");

        // Enhanced title with background
        const titleG = svg.append("g")
            .attr("class", "title-container");

        titleG.append("rect")
            .attr("x", width / 2 - 150)
            .attr("y", margin.top / 4 - 20)
            .attr("width", 300)
            .attr("height", 40)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("fill", "#264653")
            .attr("opacity", 0.8);

        titleG.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 4 + 5)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .text("PCA Scree Plot");

    }, [eigenValues, selectedDimension]);

    return (
        <div className="scree-plot-container" style={{
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            maxWidth: "800px",
            margin: "0 auto",
            padding: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: "0 0 5px 0", color: "#264653" }}>Principal Component Analysis</h2>
                <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                    Visualizing eigenvalues and explained variance
                </p>
            </div>

            <div style={{ width: "100%", textAlign: "center" }}>
                <svg ref={svgRef} style={{ maxWidth: "100%" }} />
            </div>

            <div className="controls" style={{
                marginTop: "30px",
                textAlign: "center",
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "6px"
            }}>
                <label htmlFor="dimension-slider" style={{ display: "block", marginBottom: "15px", fontWeight: "bold" }}>
                    Select Intrinsic Dimensionality: <span style={{ color: "#2a9d8f", fontSize: "18px" }}>{selectedDimension}</span>
                    <div style={{
                        backgroundColor: "#e9ecef",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        display: "inline-block",
                        marginLeft: "10px",
                        fontSize: "14px"
                    }}>
                        {(eigenValues.slice(0, selectedDimension).reduce((a, b) => a + b, 0) /
                            eigenValues.reduce((a, b) => a + b, 0) * 100).toFixed(2)}% variance explained
                    </div>
                </label>

                <input
                    id="dimension-slider"
                    type="range"
                    min="1"
                    max={eigenValues.filter(val => val > 0.001).length}
                    value={selectedDimension}
                    onChange={(e) => setSelectedDimension(parseInt(e.target.value))}
                    style={{
                        width: "90%",
                        margin: "10px auto",
                        height: "10px",
                        accentColor: "#2a9d8f"
                    }}
                />

                <div style={{
                    marginTop: "15px",
                    fontSize: "14px",
                    display: "flex",
                    justifyContent: "center",
                    gap: "20px"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <div style={{ width: "15px", height: "15px", backgroundColor: "#2a9d8f", borderRadius: "3px" }}></div>
                        <span>Selected dimensions</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <div style={{ width: "15px", height: "15px", backgroundColor: "#e9c46a", borderRadius: "3px" }}></div>
                        <span>Unselected dimensions</span>
                    </div>
                </div>
            </div>
        </div>
    );
}