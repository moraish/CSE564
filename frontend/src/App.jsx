// import { useState } from 'react';
// import GeoMap from "./components/nonStandard/GeoMap"
// import LineBarChart from "./components/standard/LineBar";
// import { chartViewConfigs } from "../../precompute/data_LineBar.js"; // Import the new config object
import Dashboard from "./Dashboard.jsx";

function App() {



  return (
    <Dashboard />
  )
}

export default App



// const [currentView, setCurrentView] = useState('overall'); // Default view
// Get the current configuration based on the view
// const currentConfig = chartViewConfigs[currentView] || chartViewConfigs.overall; // Fallback to overall

// return (
//   <div style={{
//     padding: '20px',
//     backgroundColor: '#f4f7f9',
//     height: '600px'
//   }}>
//     <div style={{ marginBottom: '20px' }}>
//       <button onClick={() => setCurrentView('overall')} style={{ marginRight: '10px' }}>Overall NYC</button>
//       <button onClick={() => setCurrentView('brooklyn')} style={{ marginRight: '10px' }}>Brooklyn</button>
//       <button onClick={() => setCurrentView('manhattan')} style={{ marginRight: '10px' }}>Manhattan</button>
//       <button onClick={() => setCurrentView('queens')} style={{ marginRight: '10px' }}>Queens</button>
//       <button onClick={() => setCurrentView('bronx')} style={{ marginRight: '10px' }}>Bronx</button>
//       <button onClick={() => setCurrentView('staten_island')}>Staten Island</button>
//     </div>

//     <LineBarChart
//       data={currentConfig.data}
//       xAxisLabel={currentConfig.xAxisLabel}
//       yBarAxisLabel="Count of Listings" // This seems constant
//       yLineAxisLabel="Average Price ($)" // This seems constant
//       title={currentConfig.title}
//       barColor="#5B8FF9"
//       lineColor="#F6BD16"
//       hoverColor="#8DC8FF"
//     />
//   </div>
// )