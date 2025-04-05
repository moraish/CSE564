import { useState } from 'react';
import BarChart from './components/standard/BarChart';
import PieChart from './components/standard/PieChart';
import * as d3 from 'd3';
import LinePlot from './components/standard/LinePlot';
import Scatterplot from './components/standard/Scatterplot';
import ScatterplotMatrix from './components/standard/ScatterplotMatrix';

export default function Dashboard() {
    // Bar Chart
    const BarData = [
        { label: 'January', value: 65 },
        { label: 'February', value: 59 },
        { label: 'March', value: 80 },
        { label: 'April', value: 81 },
        { label: 'May', value: 56 },
        { label: 'June', value: 55 },
    ];

    const pieData = [
        { label: 'Direct', value: 35 },
        { label: 'Organic Search', value: 25 },
        { label: 'Referral', value: 20 },
        { label: 'Social', value: 15 },
        { label: 'Email', value: 5 },
    ];

    const lineData = [
        { label: 'Jan', value: 10 },
        { label: 'Feb', value: 25 },
        { label: 'Mar', value: 15 },
        { label: 'Apr', value: 30 },
        { label: 'May', value: 45 },
        { label: 'Jun', value: 35 },
        { label: 'Jul', value: 55 },
        { label: 'Aug', value: 50 },
    ];

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

    return (
        <div className="h-screen bg-slate-100 p-4 font-sans flex flex-col overflow-hidden">
            {/* Simple Header */}
            <header className="mb-2 flex-shrink-0">
                <h1 className="text-xl font-medium text-gray-800">Data Visualization Dashboard</h1>
            </header>

            {/* Main Content - Chart Grid */}
            <main className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 min-h-0">
                {/* Chart 1 */}
                <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
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
                </div>

                {/* Chart 2 */}
                <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
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
                </div>

                {/* Chart 3 */}
                <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-700 mb-1 flex-shrink-0">User Engagement</h3>
                    <div className="flex-1 min-h-0">
                        <LinePlot
                            data={lineData}
                            margin={{ top: 10, right: 20, bottom: 35, left: 35 }}
                            lineColor="#3B82F6"
                            dotColor="#60A5FA"
                            xAxisLabel="Month"
                            yAxisLabel="Users (K)"
                            transitionDuration={800}
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
                <div className="bg-white rounded-md shadow-sm border border-gray-100 p-2">
                    <div className="h-full w-full flex items-center justify-center bg-gray-50">
                        <div className="text-center text-gray-400">
                            <span className="text-3xl">📊</span>
                            <p className="text-xs mt-1">Key Metrics</p>
                        </div>
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