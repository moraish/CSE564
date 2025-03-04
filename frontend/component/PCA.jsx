import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ScreePlot from './ScreePlot';
import BiPlot from './Biplot';


export default function PCA() {
    const eigenValues = [5.12189311e+00, 1.95217794e+00, 1.25796862e+00, 1.07123958e+00,
        8.37219571e-01, 7.48078010e-01, 9.55090490e-03, 1.90987796e-03,
        8.50400844e-17, 0.00000000e+00, 0.00000000e+00, 0.00000000e+00,
        0.00000000e+00];


    const sampleBiplotData = {
        // PC scores for 10 sample points (each array represents coordinates in PC space)
        pcScores: [
            [-2.1, 1.5, 0.3, -0.2],
            [1.8, -0.5, 1.2, 0.5],
            [0.5, 2.3, -1.0, 0.8],
            [-1.2, -1.8, 0.6, -0.3],
            [2.5, 0.9, -0.5, 1.1],
            [-0.8, -0.4, -1.7, 0.4],
            [1.2, 1.3, 0.8, -0.6],
            [-1.5, 0.6, 1.4, 1.0],
            [0.3, -2.1, -0.7, -1.2],
            [1.9, -1.0, 0.2, 0.7]
        ],

        // Loadings for 5 features across all PCs
        loadings: [
            [0.45, 0.12, 0.38, -0.22],
            [-0.32, 0.56, 0.21, 0.14],
            [0.51, 0.42, -0.25, 0.31],
            [-0.12, -0.48, 0.62, 0.15],
            [0.38, -0.15, -0.33, 0.51]
        ],

        // Names of the 5 features
        featureNames: ["Length", "Width", "Height", "Weight", "Density"],

        // Explained variance for each PC
        variance: [0.42, 0.25, 0.18, 0.08],

        // Default PCs to display (PC1 and PC2)
        selectedDimensions: [0, 1, 2

        ],

        // Labels for the data points
        pointLabels: ["Sample A", "Sample B", "Sample C", "Sample D", "Sample E",
            "Sample F", "Sample G", "Sample H", "Sample I", "Sample J"],

        // Original data (could be used for more detailed tooltips)
        originalData: [
            { Length: 5.2, Width: 3.6, Height: 1.4, Weight: 0.3, Density: 0.7 },
            { Length: 4.9, Width: 3.0, Height: 1.4, Weight: 0.2, Density: 0.8 },
            { Length: 4.7, Width: 3.2, Height: 1.3, Weight: 0.2, Density: 0.6 },
            { Length: 4.6, Width: 3.1, Height: 1.5, Weight: 0.3, Density: 0.9 },
            { Length: 5.0, Width: 3.6, Height: 1.4, Weight: 0.2, Density: 1.0 },
            { Length: 5.4, Width: 3.9, Height: 1.7, Weight: 0.4, Density: 0.5 },
            { Length: 4.6, Width: 3.4, Height: 1.4, Weight: 0.3, Density: 0.8 },
            { Length: 5.0, Width: 3.4, Height: 1.5, Weight: 0.2, Density: 0.7 },
            { Length: 4.4, Width: 2.9, Height: 1.4, Weight: 0.2, Density: 0.6 },
            { Length: 4.9, Width: 3.1, Height: 1.5, Weight: 0.1, Density: 0.9 }
        ]
    };



    return (
        // <ScreePlot eigenValues={eigenValues} />
        <BiPlot
            pcScores={sampleBiplotData.pcScores}
            loadings={sampleBiplotData.loadings}
            featureNames={sampleBiplotData.featureNames}
            variance={sampleBiplotData.variance}
            selectedDimensions={sampleBiplotData.selectedDimensions}
            pointLabels={sampleBiplotData.pointLabels}
            originalData={sampleBiplotData.originalData}
        />
    )

}



// Usage in a React component



