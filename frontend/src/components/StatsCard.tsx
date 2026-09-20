import React from 'react'
import { Spinner } from "@/components/ui/spinner"

export const StatsCard = ({ title, value, loading} : {title: string; value: number | undefined; loading: boolean}) => {


  return (
    <div className="border border-gray-300 rounded h-30 p-3 font-bold text-gray-500 items-start flex flex-col justify-start pb-10 pl-5">
        <div className="text-black text-4xl pt-3 [-webkit-text-stroke:1px_black]">
            {loading ? (<Spinner/>) : (value ?? 0)}
        </div>

        <div>{title}</div>
    </div>
    
  )
}

export default StatsCard