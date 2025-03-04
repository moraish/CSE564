import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import axios from 'axios';

const ChartVisualization = () => {
  const [options, setOptions] = useState([]);
  const [selectedOption1, setSelectedOption1] = useState('');
  const [selectedOption2, setSelectedOption2] = useState('');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVertical, setIsVertical] = useState(true);
  const [xAxisVariable, setXAxisVariable] = useState('option1');

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (selectedOption1) {
      if (selectedOption2) {
        fetchScatterData();
      } else {
        fetchSingleVariableData();
      }
    }
  }, [selectedOption1, selectedOption2]);

  useEffect(() => {
    if (xAxisVariable === 'option1') {
      setXAxisVariable(selectedOption1);
    } else if (xAxisVariable === 'option2') {
      setXAxisVariable(selectedOption2);
    }
  }, [selectedOption1, selectedOption2]);

  const fetchOptions = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/columns');
      setOptions(response.data);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const fetchSingleVariableData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/data/${selectedOption1}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScatterData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/data/scatter?x=${selectedOption1}&y=${selectedOption2}`
      );
      console.log('Fetched scatter data:', response.data);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching scatter data:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isNumeric = (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  };

  const binNumericData = (data, variableName) => {
    const values = data.map(d => parseFloat(d[variableName])).filter(val => !isNaN(val));

    if (values.length === 0) return { originalData: data, binned: false };

    // Check if binning is needed
    const uniqueValues = [...new Set(values)];
    if (uniqueValues.length <= 20) return { originalData: data, binned: false };

    const min = d3.min(values);
    const max = d3.max(values);
    const binCount = 15; // Adjust based on your preference
    const binWidth = (max - min) / binCount;

    // Create bin generator
    const bins = d3.range(min, max + binWidth, binWidth);

    // Bin the data
    const binnedData = data.map(item => {
      const value = parseFloat(item[variableName]);
      if (isNaN(value)) return item; // Keep non-numeric values as is

      // Find appropriate bin
      for (let i = 0; i < bins.length - 1; i++) {
        if (value >= bins[i] && value < bins[i + 1]) {
          const binLabel = `${bins[i].toFixed(2)} - ${bins[i + 1].toFixed(2)}`;
          return { ...item, [variableName]: binLabel };
        }
      }

      // Handle edge case for maximum value
      if (value === max) {
        const lastBinLabel = `${bins[bins.length - 2].toFixed(2)} - ${max.toFixed(2)}`;
        return { ...item, [variableName]: lastBinLabel };
      }

      return item;
    });

    return { originalData: binnedData, binned: true };
  };

  const determineChartTypeAndBinSize = (rawData) => {
    // Convert string numbers to actual numbers
    const data = rawData.map(d => {
      const num = Number(d);
      return isNaN(num) ? d : num;
    });

    // Get unique values in the data
    const uniqueValues = [...new Set(data)];

    // If the data is all strings or has 50 or fewer unique values, use bar chart
    if (typeof data[0] === 'string' || uniqueValues.length <= 50) {
      return { type: 'bar', binSize: null };
    } else {
      // For numeric data with more than 50 unique values, use histogram
      const min = d3.min(data);
      const max = d3.max(data);
      const range = max - min;

      // Calculate bin width to ensure no more than 20 bins
      const binCount = Math.min(20, uniqueValues.length);
      const binWidth = range / binCount;

      return {
        type: 'histogram',
        binSize: binCount,
        binWidth: binWidth
      };
    }
  };

  const renderScatterPlot = (rawData) => {
    const data = Array.isArray(rawData) ? rawData : [];
    console.log('Scatter plot data:', data);

    if (data.length === 0) {
      console.error('No data available for scatter plot');
      return;
    }

    // Determine which variable goes on which axis based on radio selection
    let xVariable = selectedOption1;
    let yVariable = selectedOption2;

    if (xAxisVariable === selectedOption2) {
      xVariable = selectedOption2;
      yVariable = selectedOption1;
    }

    // Apply binning if needed for numeric variables
    let processedData = data;
    let xBinned = false;
    let yBinned = false;

    if (data.some(d => isNumeric(d[xVariable]))) {
      const binningResult = binNumericData(processedData, xVariable);
      processedData = binningResult.originalData;
      xBinned = binningResult.binned;
    }

    if (data.some(d => isNumeric(d[yVariable]))) {
      const binningResult = binNumericData(processedData, yVariable);
      processedData = binningResult.originalData;
      yBinned = binningResult.binned;
    }

    d3.select('#chart-container').selectAll('*').remove();

    const margin = { top: 40, right: 60, bottom: 60, left: 100 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3
      .select('#chart-container')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create frequency map
    const frequencies = {};
    for (const item of processedData) {
      const key = `${item[xVariable]}-${item[yVariable]}`;
      frequencies[key] = (frequencies[key] || 0) + 1;
    }

    // Get unique values for both axes
    const uniqueX = [...new Set(processedData.map(d => d[xVariable]))].filter(Boolean);
    const uniqueY = [...new Set(processedData.map(d => d[yVariable]))].filter(Boolean);

    // Create scales
    const x = d3
      .scaleBand()
      .domain(uniqueX)
      .range([0, width])
      .padding(0.5);

    const y = d3
      .scaleBand()
      .domain(uniqueY)
      .range([height, 0])
      .padding(0.5);

    // Create a size scale for the bubbles
    const maxFrequency = Math.max(...Object.values(frequencies));
    const size = d3
      .scaleLinear()
      .domain([1, maxFrequency])
      .range([5, 20]);

    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis
    svg
      .append('g')
      .call(d3.axisLeft(y));

    // Create merged data points with frequencies
    const mergedData = [];
    for (const item of processedData) {
      const xVal = item[xVariable];
      const yVal = item[yVariable];
      if (!mergedData.some(d => d.x === xVal && d.y === yVal)) {
        mergedData.push({
          x: xVal,
          y: yVal,
          frequency: frequencies[`${xVal}-${yVal}`]
        });
      }
    }

    // Add dots
    const dots = svg
      .selectAll('circle')
      .data(mergedData)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.x) + x.bandwidth() / 2)
      .attr('cy', d => y(d.y) + y.bandwidth() / 2)
      .attr('r', d => size(d.frequency))
      .attr('fill', '#4F46E5')
      .attr('opacity', 0.6);

    // Add tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', '1px solid #ddd')
      .style('padding', '10px')
      .style('border-radius', '5px')
      .style('visibility', 'hidden');

    dots
      .on('mouseover', (event, d) => {
        tooltip
          .style('visibility', 'visible')
          .html(`${xVariable}: ${d.x}<br/>${yVariable}: ${d.y}<br/>Count: ${d.frequency}`);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      });

    // Add axis labels with binning information
    let xLabel = xVariable;
    if (xBinned) xLabel += ' (Binned)';
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .style('text-anchor', 'middle')
      .text(xLabel);

    let yLabel = yVariable;
    if (yBinned) yLabel += ' (Binned)';
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 30)
      .style('text-anchor', 'middle')
      .text(yLabel);

    // Cleanup function
    return () => {
      d3.select('.tooltip').remove();
    };
  };

  const renderChart = () => {
    if (selectedOption2) {
      renderScatterPlot(data);
      return;
    }

    d3.select('#chart-container').selectAll('*').remove();

    const chartInfo = determineChartTypeAndBinSize(data);
    const margin = { top: 40, right: 60, bottom: 60, left: 100 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3
      .select('#chart-container')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (chartInfo.type === 'bar') {
      const counts = d3.rollup(data, v => v.length, d => d);

      if (isVertical) {
        const x = d3
          .scaleBand()
          .domain([...counts.keys()].sort())
          .range([0, width])
          .padding(0.1);

        const y = d3
          .scaleLinear()
          .domain([0, d3.max([...counts.values()])])
          .range([height, 0]);

        // Add bars
        svg
          .selectAll('rect')
          .data([...counts.entries()])
          .enter()
          .append('rect')
          .attr('x', d => x(d[0]))
          .attr('y', d => y(d[1]))
          .attr('width', x.bandwidth())
          .attr('height', d => height - y(d[1]))
          .attr('fill', '#4F46E5');

        // Add axes
        svg
          .append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .selectAll('text')
          .attr('transform', 'rotate(-45)')
          .style('text-anchor', 'end');

        svg.append('g').call(d3.axisLeft(y));
      } else {
        const y = d3
          .scaleBand()
          .domain([...counts.keys()].sort())
          .range([0, height])
          .padding(0.1);

        const x = d3
          .scaleLinear()
          .domain([0, d3.max([...counts.values()])])
          .range([0, width]);

        svg
          .selectAll('rect')
          .data([...counts.entries()])
          .enter()
          .append('rect')
          .attr('y', d => y(d[0]))
          .attr('x', 0)
          .attr('height', y.bandwidth())
          .attr('width', d => x(d[1]))
          .attr('fill', '#4F46E5');

        svg
          .append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x));

        svg.append('g').call(d3.axisLeft(y));
      }
    } else if (chartInfo.type === 'histogram') {
      // Convert data to numbers for histogram
      const numericData = data.map(d => Number(d));

      const histogram = d3
        .bin()
        .domain(d3.extent(numericData))
        .thresholds(d3.range(
          d3.min(numericData),
          d3.max(numericData),
          chartInfo.binWidth
        ))(numericData);

      if (isVertical) {
        const x = d3
          .scaleLinear()
          .domain([d3.min(numericData), d3.max(numericData)])
          .range([0, width]);

        const y = d3
          .scaleLinear()
          .domain([0, d3.max(histogram, d => d.length)])
          .range([height, 0]);

        // Add histogram bars
        svg
          .selectAll('rect')
          .data(histogram)
          .enter()
          .append('rect')
          .attr('x', d => x(d.x0))
          .attr('y', d => y(d.length))
          .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
          .attr('height', d => height - y(d.length))
          .attr('fill', '#4F46E5');

        // Add tooltips for histogram
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background-color', 'white')
          .style('border', '1px solid #ddd')
          .style('padding', '10px')
          .style('border-radius', '5px')
          .style('visibility', 'hidden');

        svg.selectAll('rect')
          .on('mouseover', (event, d) => {
            tooltip
              .style('visibility', 'visible')
              .html(`Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)}<br/>Count: ${d.length}`);
          })
          .on('mousemove', (event) => {
            tooltip
              .style('top', (event.pageY - 10) + 'px')
              .style('left', (event.pageX + 10) + 'px');
          })
          .on('mouseout', () => {
            tooltip.style('visibility', 'hidden');
          });

        // Add axes
        svg
          .append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x));

        svg
          .append('g')
          .call(d3.axisLeft(y));
      } else {
        // Horizontal histogram
        const y = d3
          .scaleLinear()
          .domain([d3.min(numericData), d3.max(numericData)])
          .range([height, 0]);

        const x = d3
          .scaleLinear()
          .domain([0, d3.max(histogram, d => d.length)])
          .range([0, width]);

        svg
          .selectAll('rect')
          .data(histogram)
          .enter()
          .append('rect')
          .attr('y', d => y(d.x1))
          .attr('x', 0)
          .attr('height', d => y(d.x0) - y(d.x1))
          .attr('width', d => x(d.length))
          .attr('fill', '#4F46E5');

        svg
          .append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x));

        svg
          .append('g')
          .call(d3.axisLeft(y));
      }
    }
  };

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      console.log('Rendering with data:', data);
      renderChart();
    }
  }, [data, isVertical, xAxisVariable]);

  return (
    <div className="p-6 w-full h-screen flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">CSE 564 - Assignment 1 [ Moraish Kapoor ]</h1>
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-gray-700">Select First Variable:</label>
            <select
              className="block w-full p-2 border rounded-md"
              value={selectedOption1}
              onChange={e => {
                setSelectedOption1(e.target.value);
                if (!e.target.value) {
                  setSelectedOption2('');
                }
                // If this is the first selection, set it as X axis by default
                if (!selectedOption1) {
                  setXAxisVariable(e.target.value);
                }
              }}
            >
              <option value="">Select an option</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-gray-700">Select Second Variable (optional):</label>
            <select
              className="block w-full p-2 border rounded-md"
              value={selectedOption2}
              onChange={e => setSelectedOption2(e.target.value)}
              disabled={!selectedOption1}
            >
              <option value="">None (Single Variable)</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && <div className="mt-4">Loading...</div>}

        <div id="chart-container" className="mt-6 w-full"></div>

        {!selectedOption2 && (
          <button
            onClick={() => setIsVertical(!isVertical)}
            className="mt-4 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {isVertical ? 'Switch to Horizontal' : 'Switch to Vertical'}
          </button>
        )}

        {selectedOption1 && selectedOption2 && (
          <div className="mt-4 p-4 border rounded-md">
            <label className="block mb-2 font-semibold">X-Axis Variable:</label>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="xAxisVariable"
                  value={selectedOption1}
                  checked={xAxisVariable === selectedOption1}
                  onChange={() => setXAxisVariable(selectedOption1)}
                  className="mr-2"
                />
                {selectedOption1}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="xAxisVariable"
                  value={selectedOption2}
                  checked={xAxisVariable === selectedOption2}
                  onChange={() => setXAxisVariable(selectedOption2)}
                  className="mr-2"
                />
                {selectedOption2}
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {/* Add information about binning if applied */}
              {data.some(d => isNumeric(d[selectedOption1]) || isNumeric(d[selectedOption2])) &&
                "Numeric variables will be automatically binned for better readability."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartVisualization;