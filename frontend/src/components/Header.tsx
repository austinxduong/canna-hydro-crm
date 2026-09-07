import React from 'react'
import { NavLink } from 'react-router-dom'

const Header = () => {
  return (
    <div className="flex justify-between items-center bg-gray-100 px-4 py-1.5 border-b border-gray-300">
        <div className="font-bold text-xl">CannaHydro</div>
        <div className="text-gray-500">Dashboard</div>
        <NavLink
          to="/map"
          className={({ isActive }) => isActive ? "border-b-2 font bold" : "text-gray-500"}
        >
          Map
        </NavLink>
        <NavLink
          to="/list"
          className={({ isActive }) => isActive ? "border-b-2 font bold" : "text-gray-500"}
        >
          List
        </NavLink>
        <div className="text-gray-500">Reports</div>
        <div className="text-gray-500">Team</div>
        <div className="rounded-full size-10 bg-gray-300"></div>

    </div>
    
  )
}

export default Header