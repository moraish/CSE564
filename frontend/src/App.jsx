import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './App.css'
import ChartVisualization from '../component/ChartVisualization'
import AppBar from '../component/AppBar'
import PCA from '../component/PCA';
import Biplot from '../component/Biplot';

function App() {
  // Example data format
  const pcaData = {
    pcScores: [
      { id: "Sample1", pc1: 2.5, pc2: -1.3 },
      { id: "Sample2", pc1: -0.8, pc2: 3.1 },
      // ...more data points
    ],
    loadings: [
      { feature: "FeatureA", pc1: 0.85, pc2: 0.12 },
      { feature: "FeatureB", pc1: -0.23, pc2: 0.65 },
      // ...more features
    ],
    explainedVariance: [42.8, 28.3] // percentages
  };

  return (
    <>
      <BrowserRouter>
        <AppBar />
        <Routes>
          <Route path='/assignment1' element={<ChartVisualization />} />
          <Route path='/' element={<PCA />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
