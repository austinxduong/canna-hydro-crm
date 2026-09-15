import React, {useState, useEffect} from 'react'
import { USERS_URL } from '@/lib/constants'

interface Users {
    id: number
    name: string
    role: string
}

export const useUsers = () => {
const [data, setData] = useState<Users[]>([])
const [error, setError] = useState<string | null>()
const [loading, setLoading] = useState(true)

useEffect(() => {

    async function startFetching() {
        setLoading(true)

        try {
            const response = await fetch(USERS_URL)
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

