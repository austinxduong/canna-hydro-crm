import React, {useState, useEffect} from 'react'

interface Users {
    id: number
    name: string
    role: string
}

const SERVER_URL = 'https://canna-hydro-crm.onrender.com/users'


export const useUsers = () => {
const [data, setData] = useState<Users[]>([])
const [error, setError] = useState<string | null>()
const [loading, setLoading] = useState(true)

useEffect(() => {

    async function startFetching() {
        setLoading(true)

        try {
            const response = await fetch(SERVER_URL)
            if (!response.ok) {
                throw new Error(`Failed to load users (Status ${response.status})`)
            }
            const json = await response.json()
            setData(json)
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }   
    startFetching()
},[])

  return {
    data,
    loading,
    error
  }
}

