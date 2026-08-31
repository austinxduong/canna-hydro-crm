import React from 'react'

const SideBar = () => {
  return (
    <div className="w-64 border-r border-gray-300 p-5">
        <div className="text-xs font-bold text-gray-500">CATEGORY</div>
            <div className="flex flex-col">
            <label className="inline-flex gap-2"><input type="checkbox"/>Dispensaries</label>
            <label className="inline-flex gap-2"><input type="checkbox"/>Hydroponics</label>
            </div>
        <div className="text-xs font-bold text-gray-500 pt-5">PIPELINE STAGE</div>
        <div className="flex flex-col">
            <label className="inline-flex gap-2"><input type="checkbox"/>New</label>
            <label className="inline-flex gap-2"><input type="checkbox"/>Contacted</label>
            <label className="inline-flex gap-2"><input type="checkbox"/>Demo Scheduled</label>
            <label className="inline-flex gap-2"><input type="checkbox"/>Customer</label>
            <label className="inline-flex gap-2"><input type="checkbox"/>Lost</label>
        </div>
        <div>
            <div className="text-xs font-bold text-gray-500 pt-5">LICENSE STATUS</div>
            <select className="p-1 m-2 border border-gray-400 rounded-[5px] bg-gray-50">
                <option>Active</option>
                <option>Pending</option>
                <option>Expired</option>
            </select>
        </div>
        <div className="flex flex-col">
            <div className="text-xs font-bold text-gray-500 pt-5">DRIVE TIME FROM HOME BASE</div>
                <input type="range" min="5" max="30" className="w-47"/>
                <div className="inline-flex text-sm gap-27 ">
                    <p>5 min</p><p>30 min</p> </div>
        </div>
    </div>
  )
}

export default SideBar