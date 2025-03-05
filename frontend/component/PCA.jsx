
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ScreePlot from './ScreePlot';
import BiPlot from './Biplot';
import axios from 'axios';

export default function PCA() {
    const [eigenValues, setEigenValues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDimension, setSelectedDimension] = useState(2);
    const [biplotData, setBiplotData] = useState({
        pcScores: [],
        loadings: [],
        featureNames: [],
        variance: [],
        selectedDimensions: [0, 1],
        pointLabels: [],
        originalData: []
    });

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
                const dimensions = Array.isArray(selectedDimension)
                    ? selectedDimension
                    : Array.from({ length: selectedDimension }, (_, i) => i);

                const response = await axios.get('http://127.0.0.1:8000/biplot', {
                    params: { dimensions: dimensions }
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
                    <ScreePlot eigenValues={eigenValues} selectedDimension={selectedDimension} setSelectedDimension={setSelectedDimension} />
                    <BiPlot
                        pcScores={biplotData.pcScores}
                        loadings={biplotData.loadings}
                        featureNames={biplotData.featureNames}
                        variance={biplotData.variance}
                        selectedDimensions={biplotData.selectedDimensions}
                        pointLabels={biplotData.pointLabels}
                        originalData={biplotData.originalData}
                    />

                    {/* <h2>Hello</h2> */}
                </>
            )}
        </div>
    )
}

