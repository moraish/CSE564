import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const sampleNycGeoJson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "id": "MN", "name": "Manhattan" },
            "geometry": {
                "type": "Polygon",
                // Placeholder coordinates - replace with actual GeoJSON
                "coordinates": [[[-74.02, 40.70], [-73.98, 40.70], [-73.98, 40.80], [-74.02, 40.80], [-74.02, 40.70]]]
            }
        },
        {
            "type": "Feature",
            "properties": { "id": "BK", "name": "Brooklyn" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[-74.00, 40.60], [-73.90, 40.60], [-73.90, 40.70], [-74.00, 40.70], [-74.00, 40.60]]]
            }
        },
        {
            "type": "Feature",
            "properties": { "id": "QN", "name": "Queens" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[-73.90, 40.70], [-73.75, 40.70], [-73.75, 40.80], [-73.90, 40.80], [-73.90, 40.70]]]
            }
        }
        // Add more simplified boroughs if needed for testing
    ]
};


export default function GeoMap({
    width = 800,
    height = 600,
    geoJsonData // Prop to pass actual GeoJSON data
}) {
    const svgRef = useRef();
    const [selectedBoroughs, setSelectedBoroughs] = useState(new Set());

    // Use provided geoJsonData or fallback to sample
    const currentGeoData = geoJsonData || sampleNycGeoJson;

    useEffect(() => {
        if (!currentGeoData || !currentGeoData.features) {
            console.warn("GeoJSON data is not available or invalid.");
            return;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const projection = d3.geoMercator()
            // FitSize will automatically adjust scale and translate to fit the GeoJSON within the width/height
            .fitSize([width, height], currentGeoData);

        const pathGenerator = d3.geoPath().projection(projection);

        const g = svg.append("g"); // Group for map paths, to apply zoom

        // Draw boroughs
        g.selectAll("path")
            .data(currentGeoData.features)
            .enter()
            .append("path")
            .attr("d", pathGenerator)
            .attr("class", "borough")
            .attr("fill", d => selectedBoroughs.has(d.properties.id) ? "#2563EB" : "#9CA3AF") // Blue if selected, gray otherwise
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", 0.5)
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                const boroughId = d.properties.id;
                setSelectedBoroughs(prevSelected => {
                    const newSelected = new Set(prevSelected);
                    if (newSelected.has(boroughId)) {
                        newSelected.delete(boroughId);
                    } else {
                        newSelected.add(boroughId);
                    }
                    return newSelected;
                });
            })
            .on("mouseover", function () {
                d3.select(this).attr("fill", d => selectedBoroughs.has(d.properties.id) ? "#1D4ED8" : "#6B7280");
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", d => selectedBoroughs.has(d.properties.id) ? "#2563EB" : "#9CA3AF");
            })
            .append("title") // Basic tooltip
            .text(d => d.properties.name);

        // Zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([0.5, 8]) // Min and max zoom levels
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Optional: Set initial zoom to fit if needed, fitSize might handle this well
        // Or apply a default transform:
        // svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1).translate(-width / 2, -height / 2));


    }, [currentGeoData, width, height, selectedBoroughs]); // Rerun effect if data, dimensions, or selection changes

    return (
        <div style={{ width, height, border: '1px solid #ccc' }}>
            <svg ref={svgRef} width={width} height={height}></svg>
        </div>
    );
}