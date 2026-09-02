import { useState, useEffect } from 'react';
import { Ring } from '@/components/loading-ui/ring'
import React from 'react'

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

function getStageDotColor(stage: string) {
    if (stage === 'New') return 'bg-pink-500'
    if (stage === 'Contacted') return 'bg-orange-500'
    if (stage === 'Demo Scheduled') return 'bg-yellow-500'
    if (stage === 'Customer') return 'bg-green-500 '
    if (stage === 'Lost') return 'bg-red-500'
}

function timeAgo(last_activity_at: string) {
    const last_activity = new Date(last_activity_at).getTime(); // turn last_activity_at to milliseconds
    const nowInMillInSeconds = Date.now();
    const elapsedSeconds = Math.floor((nowInMillInSeconds - last_activity) / 1000); // divide to turn it into seconds (i.e 1000 is equal to 1 second)

    if (elapsedSeconds < 60) {
        return 'just now'
    } 
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago` // ternary to eval if plural or singular
    }
    const hours = Math.floor(minutes / 60 )
    if (hours < 24) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`
    }
    const days = Math.floor(hours / 24) 
    if ( days < 7) {
        return `${days} day${days === 1 ? '' : 's'} ago`
    }
    const weeks = Math.floor(days / 7) 
    if ( weeks < 7) {
        return `${weeks} week${weeks === 1 ? '' : 's'} ago`
    }
    const months = Math.floor(weeks / 4)
        return `${months} month${months === 1 ? '' : 's'} ago`
 }

 function resultsCount(count: number) {
        return `${count} result${count === 1 ? '' : 's'}`

 }

const BusinessList = () => {
const [serverUrl, setServerUrl] = useState('https://canna-hydro-crm.onrender.com/businesses')
const [data, setData] = useState<Business[]>([])
const [error, setError] = useState<string | null>(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
    async function startFetching() {
        try {
            const response = await fetch(serverUrl);
            const json = await response.json();
            setData(json);
            console.log(json)

        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }


    startFetching();
}, [serverUrl])

if (loading) {
    return <div className="flex justify-center"><Ring className="size-16 text-[#00d56e] justify-center"></Ring></div>
} 

if (error) {
    return <div>Something went wrong: {error} </div>
}

  return (
    <div className="p-5">
        <div className="flex justify-between mt-5">
        {resultsCount(data.length)} <div className="flex gap-2"><button className="border border-solid border-gray-400 rounded-[10px] p-2 font-bold text-gray-500 text-sm bg-gray-50">Export</button><button className="border border-solid border-gray-400 rounded-[10px] p-2 font-bold text-gray-500 text-sm bg-gray-50">Bulk assign rep</button></div>
        </div>
        <table>
            <thead>
                <tr className="border-b border-gray-400">
                <th className="py-3 text-sm text-gray-500">BUSINESS</th>
                <th className="py-3 text-sm text-gray-500">CATEGORY</th>
                <th className="py-3 text-sm text-gray-500">LICENSE</th>
                <th className="py-3 text-sm text-gray-500">STAGE</th>
                <th className="py-3 text-sm text-gray-500">REP</th>
                <th className="py-3 text-sm text-gray-500">LAST ACTIVITY</th>
                
                </tr>
            </thead>
            <tbody>
                {data.map((businesses) =>(
                    <tr className="border-b border-gray-400 hover:bg-gray-50" key={businesses.id}>
                        <td className="pr-15 py-3 px-7">
                            <div className="flex items-center gap-3">
                                <div className="border-l-2 border-gray-300 h-5"></div>
                                <div>
                                    <div className="font-semibold" >{businesses.name}</div>
                                    <div className="text-sm text-gray-500 pb-3">{businesses.address}</div>
                                </div>
                            </div>
                        </td>
                    
                        
                        <td className="px-3">{businesses.category}</td>
                        <td className="px-3">{businesses.license_status}</td>
                        <td className="px-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full border border-gray-300 gap-1.5 text-sm">
                                <span className={`size-2 rounded-full ${getStageDotColor(businesses.stage)}`}></span>{businesses.stage}   
                            </span>
                        </td>
                        <td className="px-3">{businesses.assigned_rep || 'Unassigned'}</td>
                        <td className="px-3">{timeAgo(businesses.last_activity_at)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  )
}

export default BusinessList