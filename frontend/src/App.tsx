
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import BusinessList from './components/BusinessList'
import MapView from './components/MapView'
import Dashboard from './components/Dashboard'



function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/list" replace/>} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="list" element={<BusinessList />} />
        <Route path="map" element={<div className ="h-150 2xl:h-250 max-h-[75vh]"><MapView /></div>} />
      </Route>
    </Routes>
  )
}

export default App
