import { useState } from 'react';
import BarChart from './components/standard/BarChart';
import PieChart from './components/standard/PieChart';
import * as d3 from 'd3';
import LinePlot from './components/standard/LinePlot';
import Scatterplot from './components/standard/Scatterplot';
import ScatterplotMatrix from './components/standard/ScatterplotMatrix';
import MDS from './components/nonStandard/MDS';
import PCA from './components/nonStandard/PCA';
import MCA from './components/nonStandard/MCA';
import PCP from './components/nonStandard/PCP';

import { data_overall, bronx_data, pcpDimensions, brooklyn_data, manhattan_data } from '../../precompute/data_pcp.js';
import {
    overallCitywideLineData,
    bronxLineData,
    brooklynLineData,
    manhattanLineData,
    queensLineData,
    statenIslandLineData
} from '../../precompute/data_line.js';

export default function Dashboard() {
    // Bar Chart
    // const BarData = [
    //     { label: 'January', value: 65 },
    //     { label: 'February', value: 59 },
    //     { label: 'March', value: 80 },
    //     { label: 'April', value: 81 },
    //     { label: 'May', value: 56 },
    //     { label: 'June', value: 55 },
    // ];

    // const pieData = [
    //     { label: 'Direct', value: 35 },
    //     { label: 'Organic Search', value: 25 },
    //     { label: 'Referral', value: 20 },
    //     { label: 'Social', value: 15 },
    //     { label: 'Email', value: 5 },
    // ];

    // const lineData = [
    //     { label: 'Jan', value: 10 },
    //     { label: 'Feb', value: 25 },
    //     { label: 'Mar', value: 15 },
    //     { label: 'Apr', value: 30 },
    //     { label: 'May', value: 45 },
    //     { label: 'Jun', value: 35 },
    //     { label: 'Jul', value: 55 },
    //     { label: 'Aug', value: 50 },
    // ];



    const scatterData = [
        { label: 'A', x: 10, y: 40 },
        { label: 'B', x: 20, y: 30 },
        { label: 'C', x: 30, y: 20 },
        { label: 'D', x: 40, y: 60 },
        { label: 'E', x: 50, y: 50 },
        { label: 'F', x: 60, y: 40 },
        { label: 'G', x: 70, y: 30 },
        { label: 'H', x: 80, y: 65 },
        { label: 'I', x: 90, y: 55 },
        { label: 'J', x: 100, y: 45 },
    ];

    const matrixData = [
        { label: 'A', sales: 200, profit: 15, growth: 10, cost: 80 },
        { label: 'B', sales: 150, profit: 20, growth: 15, cost: 60 },
        { label: 'C', sales: 300, profit: 25, growth: 5, cost: 120 },
        { label: 'D', sales: 250, profit: 10, growth: 20, cost: 90 },
        { label: 'E', sales: 100, profit: 18, growth: 25, cost: 40 },
        { label: 'F', sales: 230, profit: 22, growth: 12, cost: 110 },
        { label: 'G', sales: 180, profit: 16, growth: 18, cost: 85 },
        { label: 'H', sales: 400, profit: 30, growth: 8, cost: 140 },
    ];
    const matrixDimensions = ['sales', 'profit', 'growth', 'cost'];

    const mdsData = [
        { label: "Product A", x: -2.5, y: 1.2, category: "Electronics" },
        { label: "Product B", x: -2.2, y: -0.8, category: "Electronics" },
        { label: "Product C", x: -1.8, y: 1.7, category: "Electronics" },
        { label: "Product D", x: -0.5, y: 2.4, category: "Furniture" },
        { label: "Product E", x: 0.3, y: 1.8, category: "Furniture" },
        { label: "Product F", x: 0.8, y: 1.2, category: "Furniture" },
        { label: "Product G", x: 1.5, y: -0.7, category: "Apparel" },
        { label: "Product H", x: 2.0, y: -1.5, category: "Apparel" },
        { label: "Product I", x: 2.3, y: 0.5, category: "Apparel" },
        { label: "Product J", x: 1.2, y: -2.1, category: "Apparel" },
        { label: "Product K", x: -1.0, y: -1.5, category: "Electronics" },
        { label: "Product L", x: -0.2, y: -2.0, category: "Furniture" }
    ];


    const pcaData = [
        { label: "Item 1", pc1: 2.1, pc2: 1.5, category: "Group A" },
        { label: "Item 2", pc1: 1.8, pc2: -0.5, category: "Group A" },
        { label: "Item 3", pc1: 2.5, pc2: 0.8, category: "Group A" },
        { label: "Item 4", pc1: -0.2, pc2: 1.9, category: "Group B" },
        { label: "Item 5", pc1: -0.9, pc2: 1.2, category: "Group B" },
        { label: "Item 6", pc1: -1.5, pc2: 1.5, category: "Group B" },
        { label: "Item 7", pc1: -2.0, pc2: -0.8, category: "Group C" },
        { label: "Item 8", pc1: -1.7, pc2: -1.3, category: "Group C" },
        { label: "Item 9", pc1: -1.9, pc2: -0.5, category: "Group C" },
        { label: "Item 10", pc1: 0.5, pc2: -1.8, category: "Group D" },
        { label: "Item 11", pc1: 1.2, pc2: -1.5, category: "Group D" },
        { label: "Item 12", pc1: 0.8, pc2: -2.0, category: "Group D" }
    ];

    // Feature vectors showing the contribution of original features to PCs
    const pcaFeatures = [
        { feature: "Feature 1", pc1: 0.8, pc2: 0.1 },
        { feature: "Feature 2", pc1: 0.7, pc2: -0.5 },
        { feature: "Feature 3", pc1: -0.2, pc2: 0.9 },
        { feature: "Feature 4", pc1: -0.5, pc2: 0.7 }
    ];

    const mcaData = [
        { label: "Person 1", dim1: 1.2, dim2: 0.8, category: "Segment A", attributes: ["Young", "Urban", "High Income"] },
        { label: "Person 2", dim1: 1.5, dim2: 1.1, category: "Segment A", attributes: ["Young", "Urban", "High Income"] },
        { label: "Person 3", dim1: 0.9, dim2: 0.7, category: "Segment A", attributes: ["Young", "Urban", "Medium Income"] },
        { label: "Person 4", dim1: -0.2, dim2: 1.3, category: "Segment B", attributes: ["Middle Age", "Urban", "High Income"] },
        { label: "Person 5", dim1: -0.5, dim2: 1.0, category: "Segment B", attributes: ["Middle Age", "Urban", "Medium Income"] },
        { label: "Person 6", dim1: -0.8, dim2: 0.6, category: "Segment B", attributes: ["Middle Age", "Urban", "Low Income"] },
        { label: "Person 7", dim1: -1.2, dim2: -0.4, category: "Segment C", attributes: ["Senior", "Rural", "Medium Income"] },
        { label: "Person 8", dim1: -1.5, dim2: -0.7, category: "Segment C", attributes: ["Senior", "Rural", "Low Income"] },
        { label: "Person 9", dim1: -1.3, dim2: -0.5, category: "Segment C", attributes: ["Senior", "Rural", "Low Income"] },
        { label: "Person 10", dim1: 0.5, dim2: -1.0, category: "Segment D", attributes: ["Young", "Rural", "Medium Income"] },
        { label: "Person 11", dim1: 0.8, dim2: -1.3, category: "Segment D", attributes: ["Young", "Rural", "Low Income"] },
        { label: "Person 12", dim1: 0.3, dim2: -0.9, category: "Segment D", attributes: ["Middle Age", "Rural", "Low Income"] }
    ];

    // Variable categories plotted in the same correspondence space
    const mcaVariables = [
        // Age categories
        { variable: "Age", category: "Young", dim1: 0.9, dim2: -0.3 },
        { variable: "Age", category: "Middle Age", dim1: -0.4, dim2: 0.5 },
        { variable: "Age", category: "Senior", dim1: -1.4, dim2: -0.6 },

        // Location categories
        { variable: "Location", category: "Urban", dim1: 0.5, dim2: 1.1 },
        { variable: "Location", category: "Rural", dim1: -0.6, dim2: -1.0 },

        // Income categories
        { variable: "Income", category: "High Income", dim1: 0.7, dim2: 1.3 },
        { variable: "Income", category: "Medium Income", dim1: 0.2, dim2: 0.1 },
        { variable: "Income", category: "Low Income", dim1: -0.8, dim2: -0.9 }
    ];


    return (
        <div className="h-screen bg-slate-100 p-4 font-sans flex flex-col overflow-hidden">
            {/* Simple Header */}
            <header className="mb-2 flex-shrink-0">
                <h1 className="text-xl font-medium text-gray-800">Data Visualization Dashboard</h1>
            </header>

            {/* Main Content - Chart Grid */}
            <main className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 min-h-0">
                {/* Chart 1 */}
                {/* <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-700 mb-1 flex-shrink-0">Visitor Trends</h3>
                    <div className="flex-1 min-h-0">
                        <BarChart
                            data={BarData}
                            margin={{ top: 10, right: 15, bottom: 35, left: 35 }}
                            xAxisLabel="Month"
                            yAxisLabel="Visitors"
                            barColor="#4F46E5"
                            hoverColor="#818CF8"
                            transitionDuration={500}
                        />
                    </div>
                </div> */}


                <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-700 mb-1 flex-shrink-0">Principal Component Analysis</h3>
                    <div className="flex-1 min-h-0">
                        <PCA
                            data={pcaData}
                            margin={{ top: 30, right: 30, bottom: 40, left: 50 }}
                            dotColor="#8B5CF6"
                            dotHoverColor="#A78BFA"
                            dotRadius={4}
                            transitionDuration={800}
                            showLabels={true}
                            showArrows={true}
                            featureData={pcaFeatures}
                        />
                    </div>
                </div>

                {/* Chart 2 */}
                {/* <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-700 mb-1 flex-shrink-0">Traffic Distribution</h3>
                    <div className="flex-1 min-h-0">
                        <PieChart
                            data={pieData}
                            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                            innerRadius={60}
                            colorScale={d3.schemeSet2}
                            transitionDuration={750}
                            showLegend={true}
                            legendPosition="right"
                        />
                    </div>
                </div> */}
                {/* <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-700 mb-1 flex-shrink-0">Multiple Correspondence Analysis</h3>
                    <div className="flex-1 min-h-0">
                        <MCA
                            data={mcaData}
                            margin={{ top: 30, right: 30, bottom: 40, left: 50 }}
                            dotColor="#F59E0B"
                            dotHoverColor="#FBBF24"
                            dotRadius={4}
                            transitionDuration={800}
                            showLabels={false}
                            showVariables={true}
                            variableData={mcaVariables}
                        />
                    </div>
                </div> */}

                <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-700 mb-1 flex-shrink-0">User Engagement</h3>
                    <div className="flex-1 min-h-0">
                        <LinePlot
                            data={statenIslandLineData} // Use the transformed data
                            margin={{ top: 10, right: 20, bottom: 35, left: 35 }}
                            lineColor="#3B82F6"
                            dotColor="#60A5FA"
                            xAxisLabel="Category" // Update X-axis label if needed
                            yAxisLabel="Value" // Update Y-axis label if needed
                            transitionDuration={800}
                            title="Overall Citywide Air Quality Indicators" // Update title if needed
                        />
                    </div>
                </div>

                {/* overallCitywideLineData,
    bronxLineData,
    brooklynLineData,
    manhattanLineData,
    queensLineData,
    statenIslandLineData */}
                {/* Chart 3 */}


                <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-700 mb-1 flex-shrink-0">Product Attribute Analysis</h3>
                    <div className="flex-1 min-h-0">
                        <PCP
                            data={brooklyn_data}
                            dimensions={pcpDimensions}
                            margin={{ top: 30, right: 30, bottom: 40, left: 50 }}
                            lineColor="#10B981"
                            lineHoverColor="#34D399"
                            lineOpacity={0.2}
                            lineHoverOpacity={0.9}
                            lineWidth={1.5}
                            transitionDuration={800}
                            title="Product Metrics"
                            showLabels={true}
                            labelKey="label"
                            colorByCategory={true}
                            categoryAttribute="neighbourhood group"
                        />
                    </div>
                </div>

                {/* Chart 4 */}
                <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-700 mb-1 flex-shrink-0">Performance Metrics</h3>
                    <div className="flex-1 min-h-0">
                        <Scatterplot
                            data={scatterData}
                            margin={{ top: 10, right: 20, bottom: 35, left: 35 }}
                            dotColor="#10B981"
                            dotHoverColor="#34D399"
                            xAxisLabel="Cost"
                            yAxisLabel="Efficiency"
                            transitionDuration={800}
                            xKey="x"
                            yKey="y"
                            labelKey="label"
                        />
                    </div>
                </div>

                {/* Chart 5 */}
                <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-700 mb-1 flex-shrink-0">Multi-variable Analysis</h3>
                    <div className="flex-1 min-h-0">
                        <ScatterplotMatrix
                            data={matrixData}
                            dimensions={matrixDimensions}
                            margin={{ top: 2, right: 2, bottom: 10, left: 2 }}
                            padding={15}
                            dotColor="#8B5CF6"
                            dotHoverColor="#A78BFA"
                            dotRadius={3}
                            transitionDuration={600}
                            showLabels={true}
                        />
                    </div>
                </div>

                {/* Chart 6 */}
                <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-700 mb-1 flex-shrink-0">Product Similarity Map</h3>
                    <div className="flex-1 min-h-0">
                        <MDS
                            data={mdsData}
                            margin={{ top: 30, right: 30, bottom: 40, left: 50 }}  // Increased top margin for legend
                            dotColor="#8B5CF6"
                            dotHoverColor="#A78BFA"
                            dotRadius={4}
                            transitionDuration={800}
                            showLabels={true}
                        />
                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="mt-2 text-gray-400 text-xs flex-shrink-0">
                <p>Last updated: April 5, 2025</p>
            </footer>
        </div>
    );
}