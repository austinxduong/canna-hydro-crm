import Header from './components/Header'

import BusinessList from './components/BusinessList'
import SideBar from './components/SideBar'

function App() {


  return (
    <>
    <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-left pt-8">CannaHydro CRM</h1>
        <p className="text-gray-500 mb-8 text-left">Same filters as Map View, table instead of pins — for scanning and bulk work rather than territory planning</p>
      <div className="border rounded-[10px] border-solid border-gray-300 overflow-hidden">
        <Header/>
          <div className="flex">
          <SideBar /><div className="flex-1"><BusinessList /></div>
          </div>
      </div>
      <div className="flex justify-center text-sm font-bold text-gray-400 mt-4"><p>Clicking a row opens the same lead detail panel used in Map View. Checkboxes support bulk actions like reassigning a batch of leads to a rep.</p></div>
    </div>
    
    </>
  )
}

export default App
