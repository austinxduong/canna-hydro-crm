import { useState, useEffect } from 'react';
import { Ring } from '@/components/loading-ui/ring'
import React from 'react'

function getStageColor(stage) {
    if (stage === 'Customer') return 'bg-green-100 text-green-700'
    if (stage === 'Lead') return 'bg-gray-100 text-gray-700'
    if (stage === 'Contacted') return 'bg-blue-100 text-blue-700'
    if (stage === 'Lost') return 'bg-red-100 text-red-700'
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
    <table>
        <thead>
            
            <tr>
            <th>id</th>
            <th>Business</th>
            <th>Address</th>
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
                    <td>{businesses.id}</td>
                    <td>{businesses.name}</td>
                    <td>{businesses.address}</td>
                    <td>{businesses.category}</td>
                    <td>{businesses.license_status}</td>
                    <td>
                        <span className={getStageColor(businesses.stage)}>
                        {businesses.stage}
                        </span>
                    </td>
                    <td>{businesses.assigned_rep || 'Unassigned'}</td>
                    <td>{businesses.last_activity_at}</td>
                </tr>
            ))}
        </tbody>
    </table>
  )
}

export default BusinessList