
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import BusinessList from './components/BusinessList'
import MapView from './components/MapView'


function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/list" replace/>} />
        <Route path="list" element={<BusinessList />} />
        <Route path="map" element={<div style ={{ height: '600px', width: '100%'}}><MapView /></div>} />
      </Route>
    </Routes>
  )
}

export default App
