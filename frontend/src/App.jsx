import Header from './components/Header'

import BusinessList from './components/BusinessList'

function App() {


  return (
    <>
    <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-left pt-8">CannaHydro CRM</h1>
        <p className="text-gray-500 mb-8 text-left">Same filters as Map View, table instead of pins — for scanning and bulk work rather than territory planning</p>
        <Header/>
      <BusinessList />
    </div>

    </>
  )
}

export default App
