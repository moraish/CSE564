import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ScreePlot from './ScreePlot';
import BiPlot from './Biplot';
import axios from 'axios';
import ScatterPlot_Matrix from './ScatterPlot_Matrix';
import KMeans from './KMeans';

export default function PCA() {
    const [eigenValues, setEigenValues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDimension, setSelectedDimension] = useState(2);
    const [dimensions, setDimensions] = useState([0, 1]); // Initialize with default values
    const [biplotData, setBiplotData] = useState({
        pcScores: [],
        loadings: [],
        featureNames: [],
        variance: [],
        pointLabels: [],
        originalData: []
    });

    const [clusters, setClusters] = useState(3);

    // Handle dimension selection changes
    const handleDimensionChange = (axis, value) => {
        const newValue = parseInt(value);
        let newDimensions;
        if (axis === 'x') {
            newDimensions = [newValue, dimensions[1]];
        } else {
            newDimensions = [dimensions[0], newValue];
        }
        setDimensions(newDimensions);
        // This will trigger a re-render of the Biplot component with new dimensions
    };

    useEffect(() => {
        const fetchEigenValues = async () => {
            setIsLoading(true);
            let response;
            try {
                response = await axios.get('http://127.0.0.1:8000/eigenValues');
                // Extract the explained_variance_ratio array from the response
                if (response.data && response.data.explained_variance_ratio) {
                    setEigenValues(response.data.explained_variance_ratio);
                }
            } catch (error) {
                console.error("Error fetching eigenvalues:", error);
            }
            finally {
                setIsLoading(false);
                if (response && response.data) {
                    console.log('Eigenvalues after setting:', response.data.explained_variance_ratio);
                }
            }
        };

        fetchEigenValues();
    }, []);


    useEffect(() => {
        const fetchBiplotData = async () => {
            try {
                // Fix: Remove the URL query parameter as it's duplicating the request parameter
                // Fix: Convert selectedDimension to an array if it's not already
                const dims = Array.isArray(selectedDimension)
                    ? selectedDimension
                    : Array.from({ length: selectedDimension }, (_, i) => i);

                const response = await axios.get('http://127.0.0.1:8000/biplot', {
                    params: { dimensions: dims }
                });

                if (response.data && response.data.biplot) {
                    setBiplotData(response.data.biplot);
                    console.log('Biplot data after setting:', response.data.biplot);
                }
            } catch (error) {
                console.error("Error fetching biplot data:", error);
            }
        };

        fetchBiplotData();
    }, [selectedDimension]);

    return (
        <div>
            {isLoading ? (
                <div>Loading eigenvalues...</div>
            ) : (
                <>
                    <ScreePlot
                        eigenValues={eigenValues}
                        selectedDimension={selectedDimension}
                        setSelectedDimension={setSelectedDimension}
                        dimensions={dimensions}
                        setDimensions={setDimensions}
                    />


                    <BiPlot
                        pcScores={biplotData.pcScores}
                        loadings={biplotData.loadings}
                        featureNames={biplotData.featureNames}
                        variance={biplotData.variance}
                        dimensions={dimensions} // Pass the current dimensions state
                        setDimensions={setDimensions} // Pass the setter
                        handleDimensionChange={handleDimensionChange}
                        pointLabels={biplotData.pointLabels}
                        originalData={biplotData.originalData}
                    />

                    <ScatterPlot_Matrix clusterParam={clusters} />

                    <KMeans clusters={clusters} setClusters={setClusters} />
                </>
            )}
        </div>
    )
}