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


const BusinessList = () => {
const [serverUrl, setServerUrl] = useState('https://canna-hydro-crm-server.onrender.com/businesses')
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
    <table>
        <thead>
            
            <tr>
            <th>Business</th>
            <th>Category</th>
            <th>License</th>
            <th>Stage</th>
            <th>Rep</th>
            <th>Last Activity</th>
            
            </tr>
        </thead>
        <tbody>
            {data.map((businesses) =>(
                <tr key={businesses.id}>
                    <td>
                        <div className="font-semibold">{businesses.name}</div>
                        <div className="text-sm text-gray-500">{businesses.address}</div>
                    </td>
                    
                    <td>{businesses.category}</td>
                    <td>{businesses.license_status}</td>
                    <td>
                        <span className="inline-flex items-center px-3 py-1 rounded-full border border-gray-300 gap-1.5">
                            <span className={`size-2 rounded-full ${getStageDotColor(businesses.stage)}`}></span>{businesses.stage}   
                        </span>
                    </td>
                    <td>{businesses.assigned_rep || 'Unassigned'}</td>
                    <td>{timeAgo(businesses.last_activity_at)}</td>
                </tr>
            ))}
        </tbody>
    </table>
  )
}

export default BusinessList