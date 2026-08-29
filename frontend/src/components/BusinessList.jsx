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
    <div>BusinessList</div>
  )
}

export default BusinessList