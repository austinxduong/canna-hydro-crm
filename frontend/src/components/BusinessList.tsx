import { useState, useEffect } from 'react';
import { Ring } from '@/components/loading-ui/ring'
import React from 'react'
import { timeAgo, getStageDotColor, resultsCount } from '@/lib/formatters';
import { useSearchParams } from 'react-router-dom';

interface Business {
    id: number
    name: string
    address: string
    phone: string
    category: string
    license_status: string
    license_number: string
    stage: string
    assigned_rep: string | null
    last_activity_at: string
    location: string
}

const SERVER_URL= 'https://canna-hydro-crm.onrender.com/businesses'

const BusinessList = () => {
const [data, setData] = useState<Business[]>([])
const [error, setError] = useState<string | null>(null)
const [loading, setLoading] = useState(true)
const [searchParams] = useSearchParams()

const selectedCategories = searchParams.getAll('category');
const selectedPipelineStages = searchParams.getAll('pipeline_stage');
const selectedStatus = searchParams.get('status')


useEffect(() => {
    async function startFetching() {
        try {
            const response = await fetch(SERVER_URL);
            const json = await response.json();
            setData(json);
            console.log("console.log(json)",json)

        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }


    startFetching();
}, [])

if (loading) {
    return <div className="flex justify-center" role="status" aria-label="Loading businesses"><Ring className="size-16 text-[#00d56e] justify-center"></Ring></div>
} 

if (error) {
    return <div>Something went wrong: {error} </div>
}

const filteredData = data.filter((business) => {
    const categoryMatches =
    selectedCategories.length === 0 ||
    selectedCategories.includes(business.category);

    const pipelineStageMatches = 
        selectedPipelineStages.length === 0 ||
        selectedPipelineStages.includes(business.stage)

    const statusMatches =
        !selectedStatus ||
        selectedStatus === 'ALL' ||
        business.license_status === selectedStatus;

    return (
        categoryMatches &&
        pipelineStageMatches &&
        statusMatches
    )
})


  return (
    <div className="p-5">
        <div className="flex justify-between mt-5">
        {resultsCount(filteredData.length)} <div className="flex gap-2"><button className="border border-solid border-gray-400 rounded-[10px] p-2 font-bold text-gray-500 text-sm bg-gray-50">Export</button><button className="border border-solid border-gray-400 rounded-[10px] p-2 font-bold text-gray-500 text-sm bg-gray-50">Bulk assign rep</button></div>
        </div>
        <table className="w-full table-fixed">
            <colgroup>
                <col className="w-[28%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
            </colgroup>
            <thead>
                <tr className="border-b border-gray-400">
                <th className="pl-10 text-sm text-gray-500 text-left">BUSINESS</th>
                <th className="py-3 px-3 text-sm text-gray-500 text-left">CATEGORY</th>
                <th className="pr-13 text-sm text-gray-500">LICENSE</th>
                <th className="pl-10 text-sm text-gray-500 text-left">STAGE</th>
                <th className="pl-10 text-sm text-gray-500 text-left">REP</th>
                <th className="py-3 px-3 text-sm text-gray-500 text-left">LAST ACTIVITY</th>
                
                </tr>
            </thead>
            <tbody>
                {filteredData.map((business) =>(
                    <tr className="border-b border-gray-400 hover:bg-gray-50" key={business.id}>
                        <td className="pr-15 py-3 px-7">
                            <div className="flex items-center gap-3">
                                <div className="border-l-2 border-gray-300 h-5"></div>
                                <div>
                                    <div className="font-semibold" >{business.name}</div>
                                    <div className="text-sm text-gray-500 pb-3">{business.address}</div>
                                </div>
                            </div>
                        </td>
                    
                        
                        <td className="px-3">{business.category}</td>
                        <td className="px-3">{business.license_status}</td>
                        <td className="px-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full border border-gray-300 gap-1.5 text-sm">
                                <span className={`size-2 rounded-full ${getStageDotColor(business.stage)}`}></span>{business.stage}   
                            </span>
                        </td>
                        <td className="px-3">{business.assigned_rep || 'Unassigned'}</td>
                        <td className="px-3">{timeAgo(business.last_activity_at)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  )
}

export default BusinessList