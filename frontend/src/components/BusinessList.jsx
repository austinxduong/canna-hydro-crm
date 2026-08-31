import { useState, useEffect } from 'react';
import { Ring } from '@/components/loading-ui/ring'
import React from 'react'


function getStageDotColor(stage) {
    if (stage === 'Customer') return 'bg-green-500 '
    if (stage === 'Lead') return 'bg-yellow-500'
    if (stage === 'Contacted') return 'bg-blue-500'
    if (stage === 'Lost') return 'bg-red-500'
}

function timeAgo(last_activity_at) {
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

 function resultsCount(count) {
        return `${count} result${count === 1 ? '' : 's'}`

 }

const BusinessList = () => {
const [serverUrl, setServerUrl] = useState('https://canna-hydro-crm.onrender.com/businesses')
const [data, setData] = useState([])
const [error, setError] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
    async function startFetching() {
        try {
            const response = await fetch(serverUrl);
            const json = await response.json();
            setData(json);
            console.log(json)

        } catch (err) {
            setError(err.message)
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
    <div>
        <div className="flex justify-between mt-5">
        {resultsCount(data.length)} <div className="flex gap-2"><button className="border border-solid rounded-[10px] p-1">Export</button><button className="border border-solid rounded-[10px] p-1">Bulk assign rep</button></div>
        </div>
        <table>
            <thead>
                <tr>
                <th className="py-3">Business</th>
                <th className="py-3">Category</th>
                <th className="py-3">License</th>
                <th className="py-3">Stage</th>
                <th className="py-3">Rep</th>
                <th className="py-3">Last Activity</th>
                
                </tr>
            </thead>
            <tbody>
                {data.map((businesses) =>(
                    <tr key={businesses.id}>
                        <td className="pr-15">
                            <div className="font-semibold">{businesses.name}</div>
                            <div className="text-sm text-gray-500 pb-3">{businesses.address}</div>
                        </td>
                        
                        <td className="px-3">{businesses.category}</td>
                        <td className="px-3">{businesses.license_status}</td>
                        <td className="px-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full border border-gray-300 gap-1.5">
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