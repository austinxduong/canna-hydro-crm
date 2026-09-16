import React from 'react'

const Dashboard = () => {
  return (
    <div>
    <div className="font-bold p-3 text-gray-500">OVERVIEW</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-3">
        <div className="border border-gray-300 rounded h-30 p-3 font-bold text-gray-500 items-end flex justify-start pb-10 pl-5">Total Leads</div>
        <div className="border border-gray-300 rounded h-30 p-3 font-bold text-gray-500 items-end flex justify-start pb-10 pl-5">Customers Won</div>
        <div className="border border-gray-300 rounded h-30 p-3 font-bold text-gray-500 items-end flex justify-start pb-10 pl-5">Unassigned Businesses</div>
        <div className="border border-gray-300 rounded h-30 p-3 font-bold text-gray-500 items-end flex justify-start pb-10 pl-5">Active this week</div>
        </div>
      <div className="p-3">
        <button className="border font-bold bg-gray-100 text-gray-500 border-gray-300 rounded p-3 hover:text-white hover:bg-purple-700 mr-3"> + Add Lead</button>
        <button className="border font-bold bg-gray-100 text-gray-500 border-gray-300 rounded p-3 hover:text-white hover:bg-purple-700 "> View Map</button>
      </div>
      <div className="grid lg:grid-cols-2">

        <div>
        <div className="font-bold p-3 text-gray-500 ">RECENT ACTIVITY</div>
          <div className="border border-gray-300 space-y-1 m-3 p-3 rounded"> Aug 30 - stage moved from new to demo scheduled</div>
        </div>

        <div>
        <div className="font-bold p-3 text-gray-500 ">DATA SOURCE SYNC</div>
          <div className="border border-gray-300 space-y-1 m-3 p-3 rounded"> <p>Oregon Registry</p>Washington Registry<p>ESRI ARCGIS</p><p></p></div>
        </div>
        
      </div>
    </div>
  )
}

export default Dashboard