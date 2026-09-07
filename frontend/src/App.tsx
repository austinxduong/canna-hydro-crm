
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import BusinessList from './components/BusinessList'


function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/list" replace/>} />
        <Route path="list" element={<BusinessList />} />
        <Route path="map" element={<div>Map coming soon</div>} />
      </Route>
    </Routes>
  )
}

export default App
