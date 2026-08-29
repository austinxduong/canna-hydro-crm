import { useState, useEffect } from 'react';
import { Ring } from '@/components/loading-ui/ring'


import React from 'react'

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
    return <Ring className="size-16 text-[#00d56e]"></Ring>
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
                    <td>{businesses.stage}</td>
                    <td>{businesses.assigned_rep || 'Unassigned'}</td>
                    <td>{businesses.last_activity_at}</td>
                </tr>
            ))}
        </tbody>
    </table>
  )
}

export default BusinessList