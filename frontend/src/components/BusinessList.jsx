import { useState, useEffect } from 'react';

import React from 'react'

const BusinessList = () => {
const [serverUrl, setServerUrl] = useState('https://canna-hydro-crm.onrender.com/businesses')
const [data, setData] = useState([])
const [error, setError] = useState(null)

    useEffect(() => {
        async function startFetching() {
            try {
                const response = await fetch(serverUrl);
                const json = await response.json();
                setData(json);
                console.log(json)
            } catch (err) {
                setError(err.message)
            }
        }

        startFetching();
    }, [serverUrl])

  return (
    <table>
        <thead>

        </thead>
        <tbody>
            {data.map((businesses) =>(
                <tr key={businesses.id}>
                    <td>{businesses.id}</td>
                    <td>{businesses.name}</td>
                    <td>{businesses.address}</td>
                    <td>{businesses.category}</td>
                </tr>
            ))}
        </tbody>
    </table>
  )
}

export default BusinessList