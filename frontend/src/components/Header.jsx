import React from 'react'

const Header = () => {
  return (
    <div className="flex justify-between items-center bg-gray-100 border rounded-xl px-4 py-1.5">
        <div className="font-bold text-xl">CannaHydro</div>
        <div className="text-gray-500">Dashboard</div>
        <div className="text-gray-500">Map</div>
        <div className="border-b-2 font-bold" >List</div>
        <div className="text-gray-500">Reports</div>
        <div className="text-gray-500">Team</div>
        <div className="rounded-full size-10 bg-gray-300"></div>

    </div>
    
  )
}

export default Header