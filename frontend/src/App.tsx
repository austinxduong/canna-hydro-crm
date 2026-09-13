
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
        <Route path="map" element={<div className ="h-[600px] 2xl:h-[1000px] max-h-[75vh]"><MapView /></div>} />
      </Route>
    </Routes>
  )
}

export default App
